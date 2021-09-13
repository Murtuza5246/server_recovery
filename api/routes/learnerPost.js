const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
let ObjectId = require("mongodb").ObjectID;
const statementUpload = require("./statementImageUpload");

///////models
const LearnerPost = require("../model/learner");
const User = require("../model/user");
///////////////////////////////

const checkAuth = require("../middleWare/check-auth");

const nodemailer = require("nodemailer");
const { json } = require("body-parser");

const user = process.env.MONGO_PS;
const password = process.env.MONGO_USER;
const DB = process.env.MONGO_DB;
const mongoURI = `mongodb://${user}:${password}@cluster020-shard-00-00-ndanr.mongodb.net:27017,cluster020-shard-00-01-ndanr.mongodb.net:27017,cluster020-shard-00-02-ndanr.mongodb.net:27017/${DB}?ssl=true&replicaSet=cluster020-shard-0&authSource=admin&retryWrites=true`;
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once("open", () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

let transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "support@problemspotter.com", // generated ethereal user
    pass: process.env.EMAIL_PASS, // generated ethereal password
  },
});

//////////////////////////////////////////////////////////////
router.post(
  "/post",
  checkAuth,
  statementUpload.array("postImages"),
  (req, res) => {
    const {
      name,
      email,
      postContent,
      time,
      date,
      authType,
      userId,
      mentions,
      onlyMe,
      doing,
      youTubeLink,
      at,
    } = req.body;
    let objectNewId = new mongoose.Types.ObjectId();
    const learnerPost = new LearnerPost({
      _id: objectNewId,
      uploadedByName: name,
      uploadedByEmail: email,
      postContent: postContent,
      images: req.files,
      comments: [],
      time: time,
      date: date,
      authType: authType,
      userId: userId,
      likes: [],
      mentions: mentions,
      youTubeLink: youTubeLink,
      onlyMe: onlyMe,
      doing: doing,
      at: at,
    });
    learnerPost
      .save()
      .then((result) => {
        res.status(200).json({
          message: "Successfully uploaded",
        });
        User.updateOne(
          { _id: ObjectId(req.body.userId) },
          {
            $push: {
              activity: {
                action: "post",
                link: `https://civil.problemspotter.com/statements?learnerPost=${objectNewId}`,
                date: new Date(),
                day: new Date().getDay(),
              },
            },
          }
        )
          .then()
          .catch();
      })
      .catch((err) => {
        return res.status(400).json({
          message: "Something went wrong",
        });
      });
  }
);

/////////////////////////////////////

router.get("/posts", (req, res) => {
  LearnerPost.find()
    .then((result) => {
      return res.status(200).json(result);
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
      });
      console.log(err);
    });
});

/////////////////////////////////////

router.patch("/delete/:id/:userId", checkAuth, (req, res) => {
  LearnerPost.find({ _id: ObjectId(req.params.id) })
    .then((result) => {
      if (result.length === 0) {
        return res.status(200).json({
          message: "No post found",
        });
      }
      if (
        result[0].userId === req.params.userId ||
        req.body.authType === "Admin"
      ) {
        for (let i = 0; i < result[0].images.length; i++) {
          gfs.remove({
            _id: ObjectId(result[0].images[i].id),
            root: "uploads",
          });
        }
        LearnerPost.deleteOne({ _id: req.params.id })
          .then((result2) => {
            return res.status(200).json({
              message: "deleted",
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        return res.status(409).json({
          message: "Not authorized",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

/////////////////////////////////////

router.patch("/comment/:id", (req, res) => {
  LearnerPost.updateOne(
    { _id: ObjectId(req.params.id) },
    { $push: { comments: { _id: new mongoose.Types.ObjectId(), ...req.body } } }
  )
    .then((result) => {
      res.status(200).json({
        message: "Success",
      });
      User.updateOne(
        { _id: ObjectId(req.body.userId) },
        {
          $push: {
            activity: {
              action: "post",
              link: `https://civil.problemspotter.com/statements?learnerPost=${req.params.id}`,
              date: new Date(),
              day: new Date().getDay(),
            },
          },
        }
      )
        .then()
        .catch();
      /////updating item user
      LearnerPost.find({ _id: ObjectId(req.params.id) }, { userId: true })
        .then((someData) => {
          if (someData.length !== 0)
            if (someData[0].userId !== req.body.userId)
              User.updateOne(
                { _id: ObjectId(someData[0].userId) },
                {
                  $push: {
                    notification: {
                      title: `You got a comment for your post`,
                      link: `/statements?learnerPost=${req.params.id}`,
                      date: new Date(),
                      day: new Date().getDay(),
                    },
                  },
                }
              )
                .then()
                .catch();
        })
        .catch();
    })
    .catch((err) => console.log(err));
});
/////////////////////////////////////

router.get("/getcomments/:id", (req, res) => {
  LearnerPost.findOne({ _id: ObjectId(req.params.id) })
    .then((result) => {
      return res.status(200).json({
        message: "success",
        comments: result.comments,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
/////////////////////////////////////

router.patch("/replies/:statementId/:commentId", (req, res) => {
  const statementId = req.params.statementId;
  const commentId = req.params.commentId;
  LearnerPost.updateOne(
    { _id: ObjectId(statementId), "comments._id": ObjectId(commentId) },
    { $push: { "comments.$.replies": req.body } }
  )
    .then((result) => {
      res.status(200).json({
        message: "reply added",
      });
      User.updateOne(
        { _id: ObjectId(req.body.userId) },
        {
          $push: {
            activity: {
              action: "post",
              link: `/statements?learnerPost=${statementId}`,
              date: new Date(),
              day: new Date().getDay(),
            },
          },
        }
      )
        .then()
        .catch();
      /////updating item user
      LearnerPost.find({ _id: ObjectId(statementId) }, { userId: true })
        .then((someData) => {
          if (someData.length !== 0)
            if (someData[0].userId !== req.body.userId)
              User.updateOne(
                { _id: ObjectId(someData[0].userId) },
                {
                  $push: {
                    notification: {
                      title: `You got a reply for your post`,
                      link: `/statements?learnerPost=${statementId}`,
                      date: new Date(),
                      day: new Date().getDay(),
                    },
                  },
                }
              )
                .then()
                .catch();
        })
        .catch();
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({
        error: err,
      });
    });
});
/////////////////////////////////////

router.patch("/like/:postId/:userId", (req, res) => {
  LearnerPost.find({ _id: ObjectId(req.params.postId) }).then((result) => {
    if (result.length === 0) {
      return res.status(400).json({
        message: "not found",
      });
    } else {
      let likes = result[0].likes;
      let userLikeCheck = likes.filter(
        (item) => item.userId === req.params.userId
      );
      if (userLikeCheck.length === 0) {
        LearnerPost.updateOne(
          { _id: ObjectId(req.params.postId) },
          { $push: { likes: { userId: req.params.userId } } }
        )
          .then((result1) => {
            res.status(200).json({
              message: "Liked",
            });

            /////updating current user
            if (result[0].userId !== req.params.userId) {
              User.updateOne(
                { _id: ObjectId(result[0].userId) },
                {
                  $push: {
                    activity: {
                      action: "post",
                      link: `/statements?learnerPost=${req.params.postId}`,
                      date: new Date(),
                      day: new Date().getDay(),
                    },
                  },
                }
              )
                .then()
                .catch();
            }
            /////updating item user
            User.updateOne(
              { _id: ObjectId(result[0].userId) },
              {
                $push: {
                  notification: {
                    title: `You got a like for your post`,
                    link: `/statements?learnerPost=${req.params.postId}`,
                    date: new Date(),
                    day: new Date().getDay(),
                  },
                },
              }
            )
              .then()
              .catch();
          })
          .catch();
      } else {
        LearnerPost.updateOne(
          { _id: ObjectId(req.params.postId) },
          { $pull: { likes: { userId: req.params.userId } } }
        )
          .then((result1) => {
            return res.status(200).json({
              message: "disliked",
            });
          })
          .catch();
      }
      if (result[0].likes.length > 5 && result[0].likes.length < 10) {
        transporter.sendMail(
          {
            from: "support@problemspotter.com",
            to: result[0].uploadedByEmail,
            subject: "You got a like",
            html: `<h3>Hey there,</h3><h4>You got like for the post which you have uploaded.</h4><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/>><br/><p>Love from problemspotter.com ❤</p>`,
          },
          function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          }
        );
      }
    }
  });
});
/////////////////////////////////////

router.patch("/privacy/:id/:userId", checkAuth, (req, res) => {
  LearnerPost.find({ _id: ObjectId(req.params.id) })
    .then((result) => {
      if (result.length === 0) {
        return res.status(404).json({
          message: "not found",
        });
      } else {
        if (
          result[0].userId === req.params.userId ||
          req.body.authType === "Admin"
        ) {
          if (result[0].onlyMe) {
            LearnerPost.updateOne(
              { _id: ObjectId(req.params.id) },
              { $set: { onlyMe: false } }
            )
              .then((data) => {
                return res.status(200).json({
                  message: "Privacy set to everyone",
                });
              })
              .catch((err) => {
                console.log(err);
                return res.status(400).json({
                  message: "some error",
                });
              });
          } else {
            LearnerPost.updateOne(
              { _id: ObjectId(req.params.id) },
              { $set: { onlyMe: true } }
            )
              .then((data) => {
                return res.status(200).json({
                  message: "Privacy set to only me",
                });
              })
              .catch((err) => {
                console.log(err);
                return res.status(400).json({
                  message: "some error",
                });
              });
          }
        } else {
          return res.status(409).json({
            message: "you are not authorized",
          });
        }
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({
        message: "some error",
      });
    });
});
/////////////////////////////////////

module.exports = router;
