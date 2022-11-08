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

    app.get('/userReview', async(req, res)=>{
      const userEmail=req.query?.email;
      const query={userEmail:userEmail};
      const cursor=reviewCollection.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })

    app.get("/allServices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/serviceReview/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query={serviceNo:id};
      const cursor=reviewCollection.find(query);
      const result=await cursor.toArray();
      res.send(result)
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
