const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const User = require("../model/user");
let ObjectId = require("mongodb").ObjectID;

const app = express();
const router = express.Router();
// Middleware
app.use(bodyParser.json());
app.use(methodOverride("_method"));

const user = process.env.MONGO_PS;
const password = process.env.MONGO_USER;
const DB = process.env.MONGO_DB;
const mongoURI = `mongodb://${user}:${password}@cluster020-shard-00-00-ndanr.mongodb.net:27017,cluster020-shard-00-01-ndanr.mongodb.net:27017,cluster020-shard-00-02-ndanr.mongodb.net:27017/${DB}?ssl=true&replicaSet=cluster020-shard-0&authSource=admin&retryWrites=true`;
const conn = mongoose.createConnection(mongoURI);

// // Init gfs
let gfs;

conn.once("open", () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

router.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if the input is a valid image or not
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists",
      });
    }

    // If the file exists then check whether it is an image
    if (
      true
      // file.contentType === "image/jpeg" ||
      // file.contentType === "image/png" ||
      // file.contentType === "application/pdf" ||
      // file.contentType === "application/msword" ||
      // file.contentType === "audio/mpeg" ||
      // file.contentType === "audio/*" ||
      // file.contentType ===
      //   "application/vnd.openxmlformats-officedocument.wordprocessing"
    ) {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image",
      });
    }
  });
});
//////////////////////////////////////////////////
router.get("/profile/:userId", (req, res) => {
  gfs.files.findOne({ filename: req.params.userId }, (err, file) => {
    // Check if the input is a valid image or not
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists",
      });
    }
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      console.log(err);
      res.status(404).json({
        err: "Not an image",
      });
    }
  });
});

module.exports = router;
