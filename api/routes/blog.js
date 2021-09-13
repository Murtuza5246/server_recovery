const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
let ObjectId = require("mongodb").ObjectID;
const Blog = require("../model/blog");

router.post("/new/article", (req, res) => {
  const {
    name,
    email,

    time,
    date,
    title,
    description,
    article,
    imageUrl,

    userId,
    privacy,
  } = req.body;

  const blogPost = new Blog({
    _id: new mongoose.Types.ObjectId(),
    name,
    email,

    time,
    date,
    title,
    description,
    article,
    imageUrl,

    profileImage: `https://my-server-problemspotter.herokuapp.com/image/profile/${userId}`,
    userId,
    privacy,
  });
  blogPost
    .save()
    .then((result) => {
      return res.status(200).json({
        message: "Successfully uploaded",
      });
    })
    .catch((err) => {
      return res.status(400).json({
        message: "Something went wrong",
      });
    });
});

router.get("/article/:id", (req, res) => {
  Blog.findOne({ _id: ObjectId(req.params.id) })
    .then((result) => {
      return res.status(200).json(result);
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json(err);
    });
});

router.get("/articles/all", (req, res) => {
  Blog.find({ privacy: false })
    .then((result) => {
      return res.status(200).json(result);
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json(err);
    });
});
module.exports = router;
