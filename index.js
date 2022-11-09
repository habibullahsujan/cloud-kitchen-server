const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster1.rvqsrsr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const userAuth = req.headers.authorization;

  if (!userAuth) {
    return res.status(403).send({ message: "unauthorized access." });
  }
  const token = userAuth.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "unauthorized access." });
    }
    req.decoded = decoded;
    next();
  });
}

function run() {
  try {
    const serviceCollection = client
      .db("services")
      .collection("service-collection");

    const reviewCollection = client.db("services").collection("reviews");
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.limit(3).toArray();
      res.send(result);
    });

    app.get("/serviceDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/addReview", async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.send(result);
    });

    app.get("/service/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { serviceNo: id };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    
    app.post('/jwt', (req,res)=>{
      const email=req.body;
      console.log(email);
      const token=jwt.sign(email,process.env.JWT_SECRET,{expiresIn:'1d'});
      res.send({token})
    });


    app.get("/userReview", verifyJWT, async (req, res) => {
      const userEmail = req.query?.email;
      const usrVerify = req.decoded;

      if (usrVerify.email !== req.query.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }

      let query = {};
      if (req.query.email) {
        query = {
          userEmail: userEmail,
        };
      }

      const cursor = reviewCollection.find(query).sort({ reviewTime: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allServices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/serviceReview/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { serviceNo: id };
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/deleteReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    app.put("/editReview/:id", async (req, res) => {
      const id = req.params.id;
      const document = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          userReview: document?.comment,
          userRating: parseInt(document?.updatedRating),
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.post("/addReview", async (req, res) => {
      const data = req.body;
      const result = await serviceCollection.insertOne(data);
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
}
run();

app.get("/", (req, res) => {
  res.send("Sever is live now.");
});

app.listen(port, () => {
  console.log("Server is running in port:", port);
});
