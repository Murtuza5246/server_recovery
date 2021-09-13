const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Question = require("../model/question");
const User = require("../model/user");
const checkAuth = require("../middleWare/check-auth");
const { array } = require("./imageUploadEngine");
const app = express();
let ObjectId = require("mongodb").ObjectID;
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: "support@problemspotter.com",
    pass: process.env.EMAIL_PASS,
  },
});
////////////////////////////////////
router.post("/new/ask", (req, res, next) => {
  const { name, email, questionAsked, time, date, mentions } = req.body;

  const _id = new mongoose.Types.ObjectId();

  User.find({ email: email })
    .then((result) => {
      if (result.length <= 0) {
        return res.status(409).json({
          message: "UserNot found",
        });
      } else {
        const question = new Question({
          _id: _id,
          uploadedByName: name,
          uploadedByEmail: email,
          question: questionAsked,
          userId: result[0]._id,
          profileImage: result[0].profileImage,
          date: date,
          time: time,
          authType: result[0].authType,
          verified: result[0].verified,
        });
        question
          .save()
          .then((result1) => {
            if (mentions.length !== 0) {
              let mentionString = mentions.toString();
              transporter.sendMail(
                {
                  from: "support@problemspotter.com",
                  to: mentionString,
                  subject: "Mentioned in question",
                  html: `<h3>Hey there,</h3><h6>You got mentioned in a question.</h6><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>The question is live on <a href='https://civil.problemspotter.com/qanda/?questionId=${_id}'>here</a></h3><br/><p>Check what happened.😊</p><br/><p>Love from problemspotter.com ❤</p>`,
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
            User.updateOne(
              { _id: result[0]._id },
              {
                $push: {
                  activity: {
                    action: "question",
                    link: `https://civil.problemspotter.com/qanda?questionId=${_id}`,
                    date: new Date(),
                    day: new Date().getDay(),
                  },
                },
              }
            )
              .then()
              .catch();
            res.status(200).json({
              message: "Uploaded Successfully",
            });
            transporter.sendMail(
              {
                from: "support@problemspotter.com",
                to: email,
                subject: "Question on problemspotter.com",

                html: `<h1>Hi ${name},</h1><br/><h5>The question is uploaded.</h5><h4>You will get notified once someone made a response to your thoughts</h4><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>Your above question is live on <a href='https://civil.problemspotter.com/qanda/?questionId=${_id}'>here</a></h3><br/><p>The contributor like you is holding the civil society in technology era.😊</p><br/><p>Love from problemspotter.com ❤</p>`,
              },
              function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              }
            );
          })
          .catch((err) => {
            console.log(err);

            res.status(400).json({
              message: "Went wrong",
            });
          });
      }
    })
    .catch((err) => {
      message: "Something Went Wrong";
      error: err;
    });
});
///////////////////////////////////////////////

router.get("/comments", (req, res, next) => {
  Question.find()
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Fetched",
        data: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Went wrong",
        error: err,
      });
    });
});

//////////////////////////////////////////////

router.get("/getcomments/:id", (req, res, next) => {
  const id = req.params.id;
  Question.findById(id)
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Fetched",
        comments: result.comments,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err,
      });
    });
});
////////////////////////////////////////////////

router.patch("/comment/like/:questionId/:commentId/:userId", (req, res) => {
  const userId = req.params.userId;
  const questionId = req.params.questionId;
  const commentId = req.params.commentId;
  Question.find({
    _id: req.params.questionId,
  })
    .then((result) => {
      let commentRaiserHandler = result[0].comments.filter((items) => {
        return String(items._id) === String(req.params.commentId);
      });

      let newRaiserArray = commentRaiserHandler[0].vote.filter(
        (item) => item.userId === req.params.userId
      );
      const newObjectInAnswer = { userId: req.params.userId };

      if (newRaiserArray.length !== 1) {
        let updateTheCommentField = [
          ...commentRaiserHandler[0].vote,
          newObjectInAnswer,
        ];

        Question.update(
          { _id: ObjectId(questionId), "comments._id": ObjectId(commentId) },
          { $push: { "comments.$.vote": { userId } } }
        )

          .then((result) => {
            User.updateOne(
              { _id: req.params.userId },
              {
                $push: {
                  activity: {
                    action: "question",
                    link: `https://civil.problemspotter.com/qanda?questionId=${questionId}`,
                    date: new Date(),
                    day: new Date().getDay(),
                  },
                },
              }
            )
              .then()
              .catch();

            res.status(200).json({
              network: "success",
            });
          })
          .catch((error) => {
            res.status(400).json({
              error: error,
            });
          });
      }
    })
    .catch((error) => {
      console.log(error);
    });
  // Question.update({_id : req.params.questionId , "comments._id":commentId} , {$inc: {"comments.$.likes": 10}})
});

////////////////////////////////////////////////

router.patch("/likes/:questionId/:userId", checkAuth, (req, res) => {
  const questionId = req.params.questionId;
  const userId = req.params.userId;

  Question.findOne({ _id: questionId })
    .exec()
    .then((result1) => {
      const likesArray = result1.likes;
      const mainLikesArray = result1.likes;

      const newArray = likesArray.filter((item) => item.userId !== userId);

      if (newArray.length === mainLikesArray.length) {
        Question.updateOne(
          { _id: questionId },
          { $set: { likes: [...mainLikesArray, req.body] } }
        )
          .exec()
          .then((result) => {
            User.updateOne(
              { _id: userId },
              {
                $push: {
                  activity: {
                    action: "question",
                    link: `https://civil.problemspotter.com/qanda?questionId=${questionId}`,
                    date: new Date(),
                    day: new Date().getDay(),
                  },
                },
              }
            )
              .then()
              .catch();
            return res.status(200).json({
              message: "Liked",
              data: result,
            });
          })
          .catch((err) => {
            return res.status(400).json({
              message: "something is wrong in updating field",
              error: err,
            });
          });
      } else {
        return res.status(200).json({
          message: "Hand is already raised",
        });
      }
    })

    .catch((err) => {
      res.status(400).json({
        message: "Last error catch",
        error: err,
      });
    });
});
////////////////////////////////////////////////

router.patch("/new/answer/:id", (req, res, next) => {
  const id = req.params.id;
  const {
    answer,
    time,
    name,
    date,
    profileImage,
    authType,
    userId,
    verified,
  } = req.body;
  const newAnswer = {
    _id: new mongoose.Types.ObjectId(),
    answer,
    time,
    name,
    date,
    profileImage,
    authType,
    userId,
    verified,
    vote: [],
  };

  Question.findById(id)
    .exec()
    .then((result) => {
      const preAnswers = result.comments;
      preAnswers.unshift(newAnswer);
      Question.update({ _id: id }, { $set: { comments: preAnswers } })
        .exec()
        .then((result1) => {
          User.updateOne(
            { _id: userId },
            {
              $push: {
                activity: {
                  action: "question",
                  link: `https://civil.problemspotter.com/qanda?questionId=${id}`,
                  date: new Date(),
                  day: new Date().getDay(),
                },
              },
            }
          )
            .then()
            .catch();
          res.status(200).json({
            message: "Successfully updated",
          });
          transporter.sendMail(
            {
              from: "support@problemspotter.com",
              to: req.body.questionDetails.uploadedByEmail,
              subject: "Question-Answer on problemspotter.com",
              html: `<h1>Hi ${req.body.questionDetails.uploadedByName}</h1><h3>The question </h3><h4>is got a response</h4><br/><h4>Check that out <a href='https://civil.problemspotter.com/qanda?questionId=${req.body.questionDetails._id}' >here</a></h4><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>Your above question is live on <a href='https://civil.problemspotter.com/qanda/?questionId=${req.body.questionDetails._id}'>here</a></h3><br/><p>Hope you get your thoughts clear.😊</p><br/><p>Love from problemspotter.com ❤</p>`,
            },
            function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log("Email sent: " + info.response);
              }
            }
          );
        })
        .catch((err) => {
          res.status(500).json({
            message: "Went Wrong",
            error: err,
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Internal error",
        error: err,
      });
    });
});

//////////////////////////////////////////////

module.exports = router;
