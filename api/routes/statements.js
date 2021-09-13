const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const checkAuth = require("../middleWare/check-auth.js");
const Statement = require("../model/statements");
const User = require("../model/user");
const Grid = require("gridfs-stream");
const statementUpload = require("./statementImageUpload");
const Question = require("../model/question.js");
const nodemailer = require("nodemailer");
let ObjectId = require("mongodb").ObjectID;

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
////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////

router.get("/", checkAuth, (req, res, next) => {
  Statement.find()
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        statements: docs.map((doc) => {
          return {
            identifier: doc.identifier,
            statement: doc.statement,
            statementImage: doc.statementImage,

            _id: doc._id,
            request: {
              type: "GET",
            },
          };
        }),
      };

      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
// //////////////////
router.post(
  "/compose",
  checkAuth,
  statementUpload.array("statementImage", 10),
  (req, res, next) => {
    let keywordData = JSON.parse(req.body.keyword);
    let fieldsArray = JSON.parse(req.body.field);
    const id = new mongoose.Types.ObjectId();
    const statement = new Statement({
      _id: id,
      identifier: req.body.identifier,
      title: req.body.title,
      statement: req.body.statement,
      place: req.body.place,
      youTubeURL: req.body.youTubeURL,
      field: fieldsArray,
      email: req.body.email,
      profileImage: req.body.profileImage,
      userId: req.body.userId,
      keywords: keywordData,
      attention: false,
      mSecond: new Date().getTime(),
      statementImage: req.files,
      date: req.body.date,
      shareEmail: req.body.shareEmail,
      time: req.body.time,
      youTubeURLDescription: req.body.youTubeURLDescription,
      organization: req.body.organization,
      organizationLink: req.body.organizationLink,
      approved: false,
      link: req.body.link,
      label: req.body.label,
      linkTitle: req.body.linkTitle,
    });
    // res.status(201).send();
    statement
      .save()
      .then((result) => {
        let mentionedUsers = JSON.parse(req.body.mentions);
        if (mentionedUsers.length !== 0) {
          let mentionString = mentionedUsers.toString();
          transporter.sendMail(
            {
              from: "support@problemspotter.com",
              to: mentionString,
              subject: "Mentioned in statement",
              html: `<h3>Hey there,</h3><h6>You got mentioned in a statement.</h6><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>Whenever statement gets live, it will be  on <a href='https://civil.problemspotter.com/statement/id/${req.body.title
                .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                .replace(
                  / /g,
                  "-"
                )}/${id}'>here</a></h3><br/><p>Check what happened after it gets approved by one of our admin member.😊</p><br/><p>Love from problemspotter.com ❤</p>`,
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
          { _id: req.body.userId },
          {
            $push: {
              activity: {
                action: "statement",
                link: `https://civil.problemspotter.com/statement/id/${req.body.title
                  .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                  .replace(/ /g, "-")}/${id}`,
                date: new Date(),
                day: new Date().getDay(),
              },
            },
          }
        )
          .then()
          .catch();
        res.status(201).json({
          message: "Created statement successfully",
          createdStatment: {
            identifier: result.identifier,
            statement: result.statement,
            _id: result._id,
            request: {
              type: "GET",
            },
          },
        });
        transporter.sendMail(
          {
            from: "support@problemspotter.com",
            to: req.body.email,
            subject: "Statement uploaded",
            html: `<h1>Hi ${req.body.identifier},</h1><br/><p>your statement is successfully submitted on problemspotter.com for review, once it is done we will let you know about this</p><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg'  /><h4>The contributor like you is holding the civil engineering society in this technology era<h4/>`,
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
        res.status(500).json({
          error: err,
        });
      });
  }
);
////////////////////////////////////////////////////////////////////////////////////////
router.post(
  "/compose/textonly",
  checkAuth,
  statementUpload.single("statementImage"),
  (req, res, next) => {
    let keywordData = JSON.parse(req.body.keyword);
    let fieldsArray = JSON.parse(req.body.field);
    // let textObject = JSON.parse(req.body.statement);
    const id = new mongoose.Types.ObjectId();

    const statement = new Statement({
      _id: id,
      identifier: req.body.identifier,
      title: req.body.title,
      statement: req.body.statement,
      place: req.body.place,
      field: fieldsArray,
      attention: false,
      mSecond: new Date().getTime(),
      email: req.body.email,
      statementImage: "",
      shareEmail: req.body.shareEmail,
      profileImage: req.body.profileImage,
      date: req.body.date,
      youTubeURL: req.body.youTubeURL,
      youTubeURLDescription: req.body.youTubeURLDescription,
      time: req.body.time,
      userId: req.body.userId,
      organization: req.body.organization,
      organizationLink: req.body.organizationLink,
      approved: req.body.approval,
      keywords: keywordData,
      link: req.body.link,
      label: req.body.label,
    });
    statement
      .save()
      .then((result) => {
        let mentionedUsers = JSON.parse(req.body.mentions);
        if (mentionedUsers.length !== 0) {
          let mentionString = mentionedUsers.toString();
          transporter.sendMail(
            {
              from: "support@problemspotter.com",
              to: mentionString,
              subject: "Mentioned in statement",
              html: `<h3>Hey there,</h3><h6>You got mentioned in a statement.</h6><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>Whenever statement gets live, it will be  on <a href='https://civil.problemspotter.com/statement/id/${req.body.title
                .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                .replace(
                  / /g,
                  "-"
                )}/${id}'>here</a></h3><br/><p>Check what happened after it gets approved by one of our admin member.😊</p><br/><p>Love from problemspotter.com ❤</p>`,
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
          { _id: req.body.userId },
          {
            $push: {
              activity: {
                action: "statement",
                link: `https://civil.problemspotter.com/statement/id/${req.body.title
                  .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                  .replace(/ /g, "-")}/${id}`,
                date: new Date(),
                day: new Date().getDay(),
              },
            },
          }
        )
          .then()
          .catch();
        res.status(201).json({
          message: "Created statement successfully",
          createdStatment: {
            identifier: result.identifier,
            statement: result.statement,
            _id: result._id,
            request: {
              type: "GET",
              url: "http://localhost:3000/products/" + result._id,
            },
          },
        });
        transporter.sendMail(
          {
            from: "support@problemspotter.com",
            to: req.body.email,
            subject: "Statement uploaded",
            // text: `Hi ${req.body.identifier}, thank you for your contribution on problemspotter.com.
            //       You will get to know once your statement get an action by admin`,
            html: `<h1>Hi ${req.body.identifier},</h1><br/><p>your statement is successfully submitted on problemspotter.com for review, once it is done we will let you know about this</p><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg'  /><h4>The contributor like you is holding the civil engineering society in this technology era<h4/>`,
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
        res.status(500).json({
          error: err,
        });
      });
  }
);
//////////////////////////////////

router.get("/admin/approved/:email", (req, res) => {
  const email = req.params.email;
  Statement.find({ actionAdminEmail: email, approved: true })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
      console.log(err);
    });
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
router.patch("/updateFields/:id", checkAuth, (req, res) => {
  const id = req.params.id;
  const { updatedTitle, updatedContent } = req.body;
  Statement.update(
    { _id: ObjectId(id) },
    { $set: { title: updatedTitle, statement: updatedContent } }
  )
    .then((result) => {
      User.updateOne(
        { _id: req.body.userId },
        {
          $push: {
            activity: {
              action: "statement",
              link: `https://civil.problemspotter.com/statement/id/${updatedTitle
                .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                .replace(/ /g, "-")}/${id}`,
              date: new Date(),
              day: new Date().getDay(),
            },
          },
        }
      )
        .then()
        .catch();
      res.status(200).json({
        message: "Success",
        updatedContent,
        updatedTitle,
        id,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
///////////////////////////////////

router.patch("/replies/:statementId/:commentId", (req, res) => {
  const statementId = req.params.statementId;
  const commentId = req.params.commentId;
  Statement.updateOne(
    { _id: ObjectId(statementId), "comments._id": ObjectId(commentId) },
    { $push: { "comments.$.replies": req.body } }
  )
    .then((result) => {
      res.status(200).json({
        message: "reply added",
      });
      Statement.find({ _id: ObjectId(statementId) })
        .then((someData) => {
          if (someData.length !== 0)
            if (someData[0].userId !== req.body.userId) {
              User.updateOne(
                { _id: ObjectId(req.body.userId) },
                {
                  $push: {
                    notification: {
                      title: `You got a comment for your post`,
                      link: `/statement/id/${someData[0].title
                        .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                        .replace(/ /g, "-")}/${statementId}`,
                      date: new Date(),
                      day: new Date().getDay(),
                    },
                  },
                }
              );
            }
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

///////////////////////////////////

router.get("/pending", (req, res, next) => {
  Statement.find({ approved: false })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      error: err;
    });
});

//////////////////////////////////////////////////////////////////////////

router.get("/my/:id", (req, res) => {
  const id = req.params.id;

  Statement.find({ userId: id })
    .then((result) => {
      return res.status(200).json(result);
    })
    .catch((err) => {
      return res.status(200).json({
        message: "Something went wrong",
        error: MediaStreamError,
      });
    });
});
//////////////////////////////////////////////////////////////////////////

router.get("/userStatements/approved", (req, res, next) => {
  Statement.find({ approved: true })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
      });
    });
});
router.get("/user/statements/:statementId", (req, res, next) => {
  const id = req.params.statementId;
  Statement.findById(id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

// //////////////////////////////////////////////////////////////////////

router.patch("/pending/approval/:pendingId", checkAuth, (req, res, next) => {
  const id = req.params.pendingId;
  Statement.updateOne(
    { _id: id },
    {
      $set: {
        approved: true,
        actionAdminEmail: req.body.emailOfApprover,
        actionAdminName: req.body.nameOfApprover,
        actionAdminDate: req.body.dateOfApprover,
        actionAdminTime: req.body.timeOfApprover,
        actionAdminUserId: req.body.userId,
      },
    }
  )
    .exec()
    .then((result) => {
      User.updateOne(
        { _id: req.body.userId },
        {
          $push: {
            activity: {
              action: "statement",
              link: `https://civil.problemspotter.com/statement/id/statementTile/${id}`,
              date: new Date(),
              day: new Date().getDay(),
            },
          },
        }
      )
        .then()
        .catch();
      res.status(200).json({
        message: "SuccessFully approved",
      });
      transporter.sendMail(
        {
          from: "support@problemspotter.com",
          to: req.body.email,
          subject: "Statement is approved",
          // text: `Hi ${req.body.name}, the statement which you have uploaded on problemspotter is approved.
          //       The supporters like you is holding the civil field in technology era`,
          html: `<h1>Hi ${req.body.name}</h1><h3>The statement <strong>"${
            req.body.statementDetails.title
          }"</strong></h3><h4>is <strong style="color:green;text-align:center" >approved with high attention✅</strong></h4><br/><h4>your statement is marked as a high attention statement it means your statement will get a golden boarder on problemspotter.com </h4><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>Your above statement is approved and now live on <a href='https://civil.problemspotter.com/statement/id/${req.body.statementDetails.title
            .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
            .replace(/ /g, "-")}/${
            req.body.statementDetails._id
          }'>Click here</a></h3><br/><p>The contributor like you is holding the civil society in technology era hope that the statement written by you will be very helpful for the students who wants to earn something in their life😊</p><br/><p>Love from problemspotter.com ❤</p>`,
        },
        function (error, info) {
          if (error) {
            console.log(error);
          } else {
          }
        }
      );
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong , Please try again later",
      });
    });
});
///////////////////////////////////////////////////////////

router.patch("/pending/attention/:pendingId", checkAuth, (req, res, next) => {
  const id = req.params.pendingId;
  Statement.updateOne(
    { _id: id },
    {
      $set: {
        approved: true,
        attention: true,
        actionAdminEmail: req.body.emailOfApprover,
        actionAdminName: req.body.nameOfApprover,
        actionAdminDate: req.body.dateOfApprover,
        actionAdminTime: req.body.timeOfApprover,
        actionAdminUserId: req.body.userId,
      },
    }
  )
    .exec()
    .then((result) => {
      User.updateOne(
        { _id: req.body.userId },
        {
          $push: {
            activity: {
              action: "statement",
              link: `https://civil.problemspotter.com/statement/id/statementTitle/${id}`,
              date: new Date(),
              day: new Date().getDay(),
            },
          },
        }
      )
        .then()
        .catch();
      res.status(200).json({
        message: "SuccessFully approved & Madded as attention needed",
      });
      transporter.sendMail(
        {
          from: "support@problemspotter.com",
          to: req.body.email,
          subject: "Statement is approved",
          // text: `Hi ${req.body.name}, the statement which you have uploaded on problemspotter is approved.
          //       The supporters like you is holding the civil field in technology era`,
          html: `<h1>Hi ${req.body.name}</h1><h3>The statement <strong>"${
            req.body.statementDetails.title
          }"</strong></h3><h4>is <strong style="color:green;text-align:center" >approved with high attention✅</strong></h4><br/><h4>your statement is marked as a high attention statement it means your statement will get a golden boarder on problemspotter.com </h4><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>Your above statement is approved and now live on <a href='https://civil.problemspotter.com/statement/id/${req.body.statementDetails.title
            .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
            .replace(/ /g, "-")}/${
            req.body.statementDetails._id
          }'>Click here</a></h3><br/><p>The contributor like you is holding the civil society in technology era hope that the statement written by you will be very helpful for the students who wants to earn something in their life😊</p><br/><p>Love from problemspotter.com ❤</p>`,
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
        message: "Something went wrong , Please try again later",
      });
    });
});
///////////////////////////////////////////////////////////

router.post("/getSearchedFields", (req, res, next) => {
  Statement.find({ field: { $in: req.body } })
    .exec()
    .then((result) => {
      newResult = result.filter((approved) => Object.keys(approved) !== true);
      res.status(200).json(newResult);
    })
    .catch((err) => {
      res.status(500).json({
        message: "Not Worked",
        error: err,
      });
    });
});

////////////////////////////////////////////////////////////////////////////////
router.patch("/pending/rejection/:pendingId", (req, res, next) => {
  const id = req.params.pendingId;
  Statement.updateOne(
    { _id: id },
    {
      $set: {
        approved: null,
        actionAdminEmail: req.body.emailOfApprover,
        actionAdminName: req.body.nameOfApprover,
        actionAdminUserId: req.body.userId,
      },
    }
  )
    .exec()
    .then((result) => {
      User.updateOne(
        { _id: req.body.userId },
        {
          $push: {
            activity: {
              action: "statement",
              link: `https://civil.problemspotter.com/statement/id/statementTitle/${id}`,
              date: new Date(),
              day: new Date().getDay(),
            },
          },
        }
      )
        .then()
        .catch();
      res.status(200).json({
        message: "SuccessFully rejected",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong , Please try again later",
      });
    });
});

//////////////////////////////////////////////////////////////////

router.patch("/pending/delete/:id", checkAuth, (req, res) => {
  Statement.find({ _id: ObjectId(req.params.id) })
    .then((result) => {
      if (result.length !== 0) {
        if (result[0].statementImage.length !== 0) {
          for (let i = 0; i < result[0].statementImage.length; i++) {
            gfs.remove({
              _id: ObjectId(result[0].statementImage[i].id),
              root: "uploads",
            });
          }
        }
        Statement.deleteOne({ _id: ObjectId(req.params.id) })
          .then((result) => {
            return res.status(200).json({
              message: "Statement deleted successfully",
            });
          })
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
});

//////////////////////////////////////////////////////////////////

router.get("/getcomments/:id", (req, res) => {
  const id = req.params.id;
  Statement.findById(id)
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Fetched",
        comments: result.comments,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

// //////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////

router.patch("/new/answer/:id", (req, res) => {
  const id = req.params.id;

  let newQuestion = {
    _id: new mongoose.Types.ObjectId(),
    answer: req.body.answer,
    name: req.body.name,
    profileImage: req.body.profileImage,
    time: req.body.time,
    date: req.body.date,
    userId: req.body.userId,
    authType: req.body.authType,
    replies: [],
  };

  Statement.findById(id)
    .exec()
    .then((result1) => {
      let mentionedUsers = JSON.parse(req.body.mentions);
      if (mentionedUsers.length !== 0) {
        let mentionString = mentionedUsers.toString();
        transporter.sendMail(
          {
            from: "support@problemspotter.com",
            to: mentionString,
            subject: "Mentioned in statement comment",
            html: `<h3>Hey there,</h3><h4>You got mentioned in a statement comment section.</h4><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>The statement is live  on <a href='https://civil.problemspotter.com/user/statement/id/${result1.title
              .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
              .replace(
                / /g,
                "-"
              )}/${id}'>here</a></h3><br/><p>Check what happened after it gets approved by one of our admin member.😊</p><br/><p>Love from problemspotter.com ❤</p>`,
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
      const comments = result1.comments;
      comments.unshift(newQuestion);
      Statement.update({ _id: id }, { $set: { comments: comments } })
        .exec()
        .then((result) => {
          User.updateOne(
            { _id: req.body.userId },
            {
              $push: {
                activity: {
                  action: "statement",
                  link: `https://civil.problemspotter.com/statement/id/${result1.title
                    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                    .replace(/ /g, "-")}/${id}`,
                  date: new Date(),
                  day: new Date().getDay(),
                },
              },
            }
          )
            .then()
            .catch();
          /////updating item user
          if (result.userId !== req.body.userId) {
            User.updateOne(
              { _id: ObjectId(result1.userId) },
              {
                $push: {
                  notification: {
                    title: `You got a comment for your post`,
                    link: `/statement/id/${result1.title
                      .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                      .replace(/ /g, "-")}/${id}`,
                    date: new Date(),
                    day: new Date().getDay(),
                  },
                },
              }
            )
              .then()
              .catch();
          }
          res.status(200).json({
            message: "Successfully updated",
          });
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
        message: "Went wrong in main catch file",
      });
    });
});
///////////////////////////////////
// router.patch("/update/statement", (req, res) => {
//   Statement.updateOne(
//     { _id: ObjectId(req.body.id) },
//     { $set: { statement: req.body.statement } }
//   )
//     .then((result) => {
//       res.status(200).json({
//         message: "updated",
//       });
//     })
//     .catch((err) => {
//       res.status(400).json(err);
//     });
// });

////////////////////////////////////////////////////////////
module.exports = router;
//////////////////////////////////////////////////////////////////
