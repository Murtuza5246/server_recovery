const express = require("express");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: "./.env" });
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));
const questionRoutes = require("./api/routes/question");
const verification = require("./api/routes/verification");
const userRoutes = require("./api/routes/user");
const pStringRoutes = require("./api/routes/pString");
const statementRoutes = require("./api/routes/statements");
const imageUploadRoutes = require("./api/routes/imageUpload");
const identifierPost = require("./api/routes/identifierPost");
const learnerPost = require("./api/routes/learnerPost");
const blogPost = require("./api/routes/blog");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const user = process.env.MONGO_PS;
const password = process.env.MONGO_USER;
const DB = process.env.MONGO_DB;
const uri = `mongodb://${user}:${password}@cluster020-shard-00-00-ndanr.mongodb.net:27017,cluster020-shard-00-01-ndanr.mongodb.net:27017,cluster020-shard-00-02-ndanr.mongodb.net:27017/${DB}?ssl=true&replicaSet=cluster020-shard-0&authSource=admin&retryWrites=true`;
// const uri = `mongodb://${user}:${password}>@cluster020-shard-00-00.ndanr.mongodb.net:27017,cluster020-shard-00-01.ndanr.mongodb.net:27017,cluster020-shard-00-02.ndanr.mongodb.net:27017/${DB}?ssl=true&replicaSet=cluster020-shard-0&authSource=admin&retryWrites=true&w=majority`;
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected…");
  })
  .catch((err) =>
    console.log({ error: err, message: "Server is not connected" })
  );

mongoose.Promise = global.Promise;

app.use(morgan("dev"));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Headers", "http://localhost:3000"); // WE CAN ADD OUR WEBSITE AS EQUAL TO *, eg.  * = https://www.this.com
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-Type, Accept ,Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Method", "PUT,POST, GET , PATCH, DELETE");
    return res.status(200).json({});
  }
  next();
});
app.use(express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "/uploads")));

app.use("/statements", statementRoutes);
app.use("/user", userRoutes);
app.use("/pString", pStringRoutes);
app.use("/question", questionRoutes);
app.use("/verify", verification);
app.use("/image", imageUploadRoutes);
app.use("/identifierPost", identifierPost);
app.use("/learnerPost", learnerPost);
app.use("/blog", blogPost);

app.use((req, res, next) => {
  const error = new Error("Not found page");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
module.exports = app;
