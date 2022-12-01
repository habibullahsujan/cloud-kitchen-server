const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    const paymentsCollection=client.db('services').collection('payments');
    const ordersCollection=client.db('services').collection('orders')
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
    app.post("/addService", async (req, res) => {
      const data = req.body;
      const result = await serviceCollection.insertOne(data);
      res.send(result);
    });

    app.get("/service/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { serviceNo: id };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const email = req.body;
   
      const token = jwt.sign(email, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    app.get("/userReview", verifyJWT, async (req, res) => {
      const userEmail = req.query?.email;
      const usrVerify = req.decoded;
      if (usrVerify.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
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
      const size=parseInt(req.query.size);
      const page=parseInt(req.query.page);
      // console.log(size,page);
    const query = {};
    const cursor = serviceCollection.find(query);
    //ex= skip=size*page=5*4=20
    //limit ex =size=5
    const products = await cursor.skip(page*size).limit(size).toArray();
    //count how many data in this database collection
    const totalData = await serviceCollection.estimatedDocumentCount();
    //send a object and inside this send total data and products
    res.send({ totalData, products });
  });

    app.get("/serviceReview/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { serviceNo: id };
      const cursor = reviewCollection.find(query).sort({ reviewTime: -1 });
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

    //get a single service details
    app.get('/service_details/:id', async(req, res)=>{
      const id=req.params.id;
      
      const query={_id:ObjectId(id)};
      const result=await serviceCollection.findOne(query);
      res.send(result)
    })

    //payment gateway
    app.post("/create-payment-intent", async (req, res) => {
      const {price } = req.body;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount:price,
        currency:"usd",
        "payment_method_types":[
          "card"
        ]
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //store payment information in database
    app.post('/payments', async(req, res)=>{
      const data=req.body;
      const result=await paymentsCollection.insertOne(data);
      res.send(result)
    });
    //store all user order in database
    app.post('/orders',async(req, res)=>{
      const data=req.body;
      const result=await ordersCollection.insertOne(data);
      res.send(result)
    } );

    app.put('/set_like_db', async(req, res)=>{
      
    })

    // const verifyAdminRole=(req, res, next)=>{
      
    //   const email=req.body.email;
    //   const query={users}
    // }
  
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
