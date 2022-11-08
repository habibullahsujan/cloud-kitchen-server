const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Sever is live now.");
});

app.listen(port, () => {
  console.log("Server is running in port:", port);
});
