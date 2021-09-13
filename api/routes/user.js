const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const upload = require("./imageUploadEngine");
const uploadSignUp = require("./signUpImage");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
let ObjectId = require("mongodb").ObjectID;
const User = require("../model/user");
const Statement = require("../model/statements");
const Question = require("../model/question");
const IdentifierPost = require("../model/identifierPost");
const LearnerPost = require("../model/learner");

const user = process.env.MONGO_PS;
const password = process.env.MONGO_USER;
const DB = process.env.MONGO_DB;
const mongoURI = `mongodb://${user}:${password}@cluster020-shard-00-00-ndanr.mongodb.net:27017,cluster020-shard-00-01-ndanr.mongodb.net:27017,cluster020-shard-00-02-ndanr.mongodb.net:27017/${DB}?ssl=true&replicaSet=cluster020-shard-0&authSource=admin&retryWrites=true`;
const conn = mongoose.createConnection(mongoURI);
const checkAuth = require("../middleWare/check-auth");

const nodemailer = require("nodemailer");
const { json } = require("body-parser");

let transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "support@problemspotter.com", // generated ethereal user
    pass: process.env.EMAIL_PASS, // generated ethereal password
  },
});

// Init gfs
let gfs;

conn.once("open", () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

//////////////////////////////////////////////

router.get("/notification/:id", (req, res) => {
  User.find({ _id: ObjectId(req.params.id) }, { notification: true }).then(
    (result) => {
      return res.status(200).json(result[0].notification);
    }
  );
});

router.patch("/notification/reset/:userId", (req, res) => {
  User.updateOne(
    { _id: ObjectId(req.params.userId) },
    { $set: { notification: [] } }
  )
    .then()
    .catch();
});

//////////////////////////////////////////////

router.get("/notificationCheck/:userId", (req, res) => {
  let notificationCheckArray = [];
  Statement.find({ userId: req.params.userId }, { _id: true })
    .then((result) => {
      for (let i = 0; i < result.length; i++) {
        notificationCheckArray.push(result[i]);
      }
    })
    .catch();
  IdentifierPost.find({ userId: req.params.userId }, { _id: true })
    .then((result1) => {
      for (let i = 0; i < result1.length; i++) {
        notificationCheckArray.push(result1[i]);
      }
    })
    .catch();
  LearnerPost.find({ userId: req.params.userId }, { _id: true })
    .then((result2) => {
      for (let i = 0; i < result2.length; i++) {
        notificationCheckArray.push(result2[i]);
      }
      return res.status(200).json(notificationCheckArray.length);
    })
    .catch();
});

//////////////////////////////////////////////
router.post(
  "/signup/:someId",
  uploadSignUp.single("profileImage"),
  (req, res, next) => {
    User.find({ email: req.body.email })
      .exec()
      .then((user) => {
        if (user.length >= 1) {
          return res.status(200).json({
            message: "User already exists",
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              res.status(500).json({
                error: err,
              });
            } else {
              let composeHandle = false;
              let canApprove = false;
              let emailKey =
                new mongoose.Types.ObjectId() +
                "_" +
                new mongoose.Types.ObjectId() +
                "_" +
                Math.random(0, 10000);

              const userId = req.file.filename;
              if (req.body.authType === "Admin") {
                canApprove = true;
              }
              if (
                req.body.authType === "Identifier" ||
                req.body.authType === "Admin" ||
                req.body.authType === "Professor"
              ) {
                composeHandle = true;
              }
              transporter.sendMail(
                {
                  from: "support@problemspotter.com",
                  to: req.body.email,
                  subject: "Verify your email",
                  // text: `Hi ${req.body.fName}, the statement which you have uploaded on problemspotter is approved.
                  //       The supporters like you is holding the civil field in technology era problemspotter.com/account/authentication/${userId}/${emailKey}`,
                  html: `<h1>Hi ${
                    req.body.fName + "  " + req.body.lName
                  }</h1><br/><p>Dear user of problemspotter.com , to use account features on problemspotter.com you first need to verify your email. <strong>The email verification link is given below.</strong> </p><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><p>Link for verification <strong><a href='https://civil.problemspotter.com/account/authentication/${userId}/${emailKey}'  >problemspotter.com/account/authentication/${userId}/${emailKey}</a></strong></p><p>Love from problemspotter.com ❤</p>`,
                },
                function (error, info) {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log("Email sent: " + info.response);
                  }
                }
              );

              const user = new User({
                _id: userId,
                profileImage: req.file.filename,
                profileImageId: req.file.id,
                authType: req.body.authType,
                email: req.body.email,
                password: hash,
                fName: req.body.fName,
                lName: req.body.lName,
                contact: req.body.contact,
                dob: req.body.dob,
                cName: req.body.cName,
                cAddress: req.body.cAddress,
                city: req.body.city,
                about: {},
                nState: req.body.nState,
                pCode: req.body.pCode,
                pString: req.body.pString,
                experience: req.body.experience,
                creationDate: new Date(),
                creationTime: req.body.creationTime,
                savedStatements: [],
                followers: [],
                activity: [],
                composeHandle: composeHandle,
                OName: req.body.OName,
                OAddress: req.body.OAddress,
                field: req.body.field,
                notification: [],
                emailVerified: false,
                numberVerified: false,
                canApprove: canApprove,
                number: "",
                emailKey,
                ban: false,
                pBan: false,
                ban: {
                  action: false,
                  reason: "",
                },
                pBan: {
                  action: false,
                  reason: "",
                },
              });
              user
                .save()
                .then((result21) => {
                  res.status(201).json({
                    message: "User Created successfully",
                  });
                })
                .catch((err) => {
                  res.status(500).json({
                    error: err,
                  });
                  console.log(err);
                });
            }
          });
        }
      })
      .catch((err) => {
        res.status(400).json({
          message: "error happened ",
          error: err,
        });
      });
  }
);

////////////////////////////////

router.patch("/update/about/:id/:about", checkAuth, (req, res) => {
  const id = req.params.id;

  User.updateOne({ _id: id }, { $set: { about: req.params.about } })
    .then((result) => {
      res.status(200).json({
        message: "Successfully updated.",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err,
      });
    });
});
/////////////////////////////////////////////////////////
router.patch("/about/update/:id", (req, res) => {
  const id = req.params.id;
  User.updateOne({ _id: id }, { about: req.body.data })
    .then((result) => {
      let mentionedUsers = JSON.parse(req.body.mentions);

      if (mentionedUsers.length !== 0) {
        let mentionString = mentionedUsers.toString();
        transporter.sendMail(
          {
            from: "support@problemspotter.com",
            to: mentionString,
            subject: "Mentioned in About section",
            html: `<h3>Hey there,</h3><h6>You got mentioned in someone's about section.</h6><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><br/><h3>Check there about section by clicking <a href='https://civil.problemspotter.com/user/details/userprofile/${id}'>here</a></h3><br/><p>Check what happened after it gets approved by one of our admin member.😊</p><br/><p>Love from problemspotter.com ❤</p>`,
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
      res.status(200).json({
        message: "successfully updated",
      });
    })
    .catch((err) => {
      res.status(400).json({
        message: "not updated",
        error: err,
      });
      console.log(err);
    });
});

/////////////////////////////////////////////////////////

router.patch("/follow/unFollow/:userId/:followersId", checkAuth, (req, res) => {
  const userId = req.params.userId;
  const followersId = req.params.followersId;

  User.find({ _id: userId }).then((result2) => {
    if (result2.length !== 0) {
      let followersArray = result2[0].followers;
      let alreadyFollows = followersArray.filter(
        (item) => item.userId === followersId
      );
      let notFollowing = followersArray.filter(
        (item) => item.userId !== followersId
      );
      if (alreadyFollows.length === 1) {
        User.updateOne(
          { _id: followersId },
          { $pull: { following: { userId: userId } } }
        )
          .then((data) => console.log())
          .catch((err) => console.log(err));
        User.updateOne({ _id: userId }, { followers: notFollowing })

          .then((result) => {
            res.status(200).json({
              message: "un-followed",
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        User.updateOne(
          { _id: followersId },
          {
            $push: {
              following: {
                userId: userId,
                name: result2[0].fName + " " + result2[0].lName,
                email: result2[0].email,
                profileImage: result2[0].profileImage,
                authType: result2[0].authType,
              },
            },
          }
        )
          .then((data) => console.log())
          .catch((err) => console.log(err));
        User.updateOne(
          { _id: userId },
          {
            $push: {
              followers: req.body,
            },
          }
        )
          .then((result) => {
            res.status(200).json({
              message: "followed",
            });
            transporter.sendMail(
              {
                from: "support@problemspotter.com",
                to: result2[0].email,
                subject: "New follower",
                // text: `Hi ${req.body.fName}, the statement which you have uploaded on problemspotter is approved.
                //       The supporters like you is holding the civil field in technology era problemspotter.com/account/authentication/${userId}/${emailKey}`,
                html: `<h1>Hi ${
                  result2[0].fName + "  " + result2[0].lName + ","
                }</h1><br/><p>Dear user of problemspotter.com , <a href="https://civil.problemspotter.com/user/details/${req.body.name
                  .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
                  .replace(/ /g, "-")}/${req.body.userId}" > ${
                  req.body.name
                }</a> has followed you. </p><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><p> Checkout your profile on <a href="https://problemspotter.com/user/details/${
                  result2[0]._id
                }" >here</a>  </p><p>Love from problemspotter.com ❤</p>`,
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
          });
      }
    } else {
      return res.status(200).json({
        message: "User does not found",
      });
    }
  });
});
/////////////////////////////////////////////////////////

router.patch("/forget", (req, res) => {
  User.find({ email: req.body.email })
    .then((result) => {
      if (result.length === 0) {
        return res.status(200).json({
          message: "The email you entered is wrong",
        });
      } else {
        let forgetKey =
          new mongoose.Types.ObjectId() +
          "_" +
          new mongoose.Types.ObjectId() +
          "_" +
          Math.random(0, 10000);
        User.updateOne(
          { email: req.body.email },
          { $set: { forgetKey: forgetKey } }
        )
          .then((result) => {})
          .catch((err) => {
            console.log(err);
          });
        transporter.sendMail(
          {
            from: "support@problemspotter.com",
            to: req.body.email,
            subject: "Reset password link",
            // text: `Hi ${req.body.fName}, the statement which you have uploaded on problemspotter is approved.
            //       The supporters like you is holding the civil field in technology era problemspotter.com/account/authentication/${userId}/${emailKey}`,
            html: `<h1>Hi ${
              result[0].fName + "  " + result[0].lName
            }</h1><br/><p>Dear user of problemspotter.com , You have made an forget password request from your account.<strong>The password reset link is given below.</strong> </p><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><p>Link for password reset <strong><a href='https://civil.problemspotter.com/account/authentication/forget/${forgetKey}'  >problemspotter.com/account/authentication/forget/${forgetKey}</a></strong></p><p>if it was not you just ignore this email.</p><p>Love from problemspotter.com ❤</p>`,
          },
          function (error, info) {
            if (error) {
              console.log(error);
            } else {
              res.status(200).json({
                message: "Reset link has been sent",
              });
              console.log("Email sent: " + info.response);
            }
          }
        );
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
////////////////////////////////////////////////////////

router.patch("/forget/newPassword/:forgetKey", (req, res) => {
  const forgetKey = req.params.forgetKey;
  User.find({ forgetKey: forgetKey })
    .then((result) => {
      if (result.length === 0) {
        return res.status(200).json({
          message: "We could not find you",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            res.status(500).json({
              error: err,
            });
          } else {
            User.updateOne(
              { forgetKey: forgetKey },
              { $set: { password: hash, forgetKey: "forget key is used" } }
            )
              .then((result1) => {
                res.status(200).json({
                  message: "Password has been reset successfully",
                });
                transporter.sendMail(
                  {
                    from: "support@problemspotter.com",
                    to: result[0].email,
                    subject: "Password change",
                    // text: `Hi ${req.body.fName}, the statement which you have uploaded on problemspotter is approved.
                    //       The supporters like you is holding the civil field in technology era problemspotter.com/account/authentication/${userId}/${emailKey}`,
                    html: `<h1>Hi ${
                      result[0].fName + "  " + result[0].lName
                    }</h1><br/><p>Dear user of problemspotter.com , your password has been successfully reset.</p><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><p>You can now log into your account. Thank you</p><p>if it was not you change you password or reply us on this mail.</p><p>Love from problemspotter.com ❤</p>`,
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
              .catch();
          }
        });
      }
    })
    .catch();
});

////////////////////////////////////////////////////////

router.get("/oauth/:email", (req,res) => {
  const email = req.params.email
  User.findOne({email: email}).then(result => {
    return res.status(200).json(result);
  }).catch()
})
////////////////////////////////////////////////////////

router.patch("/account/authentication/:id/:emailKey/:number", (req, res) => {
  const id = req.params.id;
  const emailKey = new mongoose.Types.ObjectId();
  const number = req.params.number;
  User.find({ emailKey: req.params.emailKey })
    .then((result5) => {
      if (result5.length === 0) {
        res.status(400).json({
          message: "user not found",
        });
      }
    })
    .catch();

  User.updateOne(
    { emailKey: req.params.emailKey, _id: ObjectId(id), emailVerified: false },
    {
      $set: {
        emailVerified: true,
        emailKey,
        number,
        numberVerified: true,
      },
    }
  )
    .then((result) => {
      res.status(200).json({
        message: "User verified successfully",
      });
      User.findOne({ _id: id })
        .then((response) => {
          transporter.sendMail(
            {
              from: "support@problemspotter.com",
              to: response.email,
              subject: "Verification of email is successfully completed",
              // text: `Hi ${req.body.fName}, the statement which you have uploaded on problemspotter is approved.
              //       The supporters like you is holding the civil field in technology era problemspotter.com/account/authentication/${userId}/${emailKey}`,
              html: `<h1>Hi ${
                response.fName + "  " + response.lName
              }</h1><br/><p>Dear user of problemspotter.com, your email verification on problemspotter.com is successfully completed. <strong>You can log into your account now.</strong> </p><img src='https://my-server-problemspotter.herokuapp.com/websiteLogo/newlogo.jpg' /><p>Click on this link to log into you account <strong><a href='https://civil.problemspotter.com/login'  >click here</a></strong></p><p>Love from problemspotter.com ❤</p>`,
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
        .catch((err) => {});
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
      });
    });
});

////////////////////////////////////////////////////////

router.get("/all", (req, res) => {
  User.find(
    {},
    { lName: true, fName: true, _id: true, profileImage: true, email: true }
  )
    .then(async (result) => {
      const newArray = [];
      for (let i = 0; i < result.length; i++) {
        newArray.push({
          text:
            result[i].fName.toUpperCase() + " " + result[i].lName.toUpperCase(),
          name: result[i].fName + " " + result[i].lName + i,
          value: result[i].fName + " " + result[i].lName,
          url: `https://civil.problemspotter.com/user/details/${
            result[i].fName + "-" + result[i].lName
          }/${result[i]._id}`,
          avatar: `https://my-server-problemspotter.herokuapp.com/image/profile/${result[i]._id}`,

          userId: result[i]._id,
          link: `https://civil.problemspotter.com/user/details/${
            result[i].fName + "-" + result[i].lName
          }/${result[i]._id}`,
          email: result[i].email,
        });
      }
      await res.status(200).json({
        members: newArray,
      });
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
      });
    });
});

////////////////////////////////////////////////////////

router.patch("/verify/authenticator/:id/:emailKey", (req, res) => {
  User.update(
    { _id: ObjectId(req.params.id) },
    { $set: { emailKey: "Verified", emailVerified: true } }
  )
    .then((result) => {
      res.status(200).json({
        message: "SuccessFully verified",
      });
    })
    .catch((err) => {
      res.status(400).json({
        message: "Link is not good",
        error: err,
      });
    });
});

////////////////////////////////////////////////////////

router.delete("/delete/:userId", (req, res, next) => {
  User.remove({ _id: req.params.userId })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "User Removed Successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
///////////////////////////////////////
router.get("/statement/getArrayOfUser/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.findById(id)
    .then((result) => {
      if (result.savedStatements) {
        res.status(200).json({
          save: result.savedStatements,
        });
      }
      res.status(309).json({
        message: "not available",
        save: result.savedStatements,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
/////////////////////////////////////

router.get("/statement/profileFetcher/:userEmail", (req, res, next) => {
  const email = req.params.userEmail;
  User.findOne({ email: email })
    .exec()
    .then((result) => {
      res.status(200).json({
        image: result.profileImage,
      });
    })
    .catch((err) => {
      res.status(409).json({
        error: err,
      });
    });
});

//////////////////////////////////////
router.patch("/statement/save/:userId", (req, res, next) => {
  const id = req.params.userId;
  let arrayCheck = [];
  User.findOne({ _id: id })
    .then((data) => {
      arrayCheck = data.savedStatements.filter(
        (item) => item._id === req.body._id
      );
      if (arrayCheck.length === 0) {
        User.updateOne({ _id: id }, { $push: { savedStatements: req.body } })
          .then((result) => {
            res.status(200).json({
              message: "Saved",
            });
          })
          .catch((err) => {
            res.status(400).json({
              error: err,
            });
          });
      } else {
        return res.status(200).json({
          message: "Already saved",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
////////////////////////////////////
router.get("/level/:id", (req, res) => {
  User.find({ _id: ObjectId(req.params.id) }, { activity: true })
    .then((result) => {
      return res.status(200).json({
        level: result[0].activity.length,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({
        message: "something went wrong",
      });
    });
});
//////////////////////////////////////
router.patch("/statement/remove/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.updateOne(
    { _id: id },
    { $pull: { savedStatements: { _id: req.body._id } } }
  )
    .then((result) => {
      res.status(200).json({
        message: "Saved SuccessFully",
      });
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
      });
    });
});
////////////////////////////////////
router.patch("/link/:action/:id", (req, res) => {
  const action = req.params.action;
  const id = req.params.id;
  if (action === "instagram") {
    User.updateOne({ _id: id }, { instagram: req.body.link })
      .then((result) => {
        res.status(200).json({
          message: "Updated",
        });
      })
      .catch((err) => {
        res.status(400).json({
          error: err,
        });
      });
  }
  if (action === "facebook") {
    User.updateOne({ _id: id }, { facebook: req.body.link })
      .then((result) => {
        res.status(200).json({
          message: "Updated",
        });
      })
      .catch((err) => {
        res.status(400).json({
          error: err,
        });
      });
  }
});

////////////////////////////////////

router.patch("/update/rating/:id", (req, res) => {
  User.findOne({ _id: ObjectId(req.params.id) })
    .then((result) => {
      const userRatingArray = result.rating;
      const checkUserId = userRatingArray.filter(
        (item) => item.userId === req.body.userId
      );
      if (checkUserId.length === 0) {
        User.updateOne(
          { _id: req.params.id },
          {
            $push: {
              rating: req.body,
            },
          }
        )
          .then((result2) => {
            User.updateOne(
              { _id: req.body.userId },
              {
                $push: {
                  activity: {
                    action: "rating",
                    link: `https://civil.problemspotter.com/user/details/${
                      result.fName + "-" + result.lName
                    }//${req.params.id}`,
                    date: new Date(),
                    day: new Date().getDay(),
                  },
                },
              }
            )
              .then()
              .catch();
            res.status(200).json({
              message: "successfully added",
            });
          })
          .catch((err) => {
            console.log("failed to add new userId");
          });
      } else {
        User.updateOne(
          { _id: req.params.id, "rating.userId": req.body.userId },
          { $set: { "rating.$.value": req.body.value } }
        )
          .then((result2) => {
            User.updateOne(
              { _id: req.body.userId },
              {
                $push: {
                  activity: {
                    action: "rating",
                    link: `https://civil.problemspotter.com/user/details/${
                      result.fName + "-" + result.lName
                    }/${req.params.id}`,
                    date: new Date(),
                    day: new Date().getDay(),
                  },
                },
              }
            )
              .then()
              .catch();
            res.status(200).json({
              value: result2,
            });
          })
          .catch((err) => {
            console.log("existing user value failed");
          });
      }
    })
    .catch((err) => {
      console.log("failed in main catch");
    });
});

////////////////////////////////////

router.get("/details/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.find({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "success",
        userDetails: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
//////////////////////////////////////////////

router.post("/upload/sound", upload.single("sound"), (req, res) => {
  if (req.file.filename) {
    res.status(200).json({
      message: "uploaded",
      name: req.file,
    });
  } else {
    res.status(500).json({
      message: "Not uploaded",
      name: req.file,
    });
  }
});

//////////////////////////////////////////////////////////
router.patch(
  "/profile/:userId",
  upload.single("profileImage"),
  (req, res, next) => {
    const id = req.params.userId;

    User.findOne({ _id: id })
      .exec()
      .then((result1) => {
        gfs.remove({ _id: result1.profileImageId, root: "uploads" });
      })
      .catch();

    User.updateOne(
      { _id: id },
      {
        $set: { profileImage: req.file.filename, profileImageId: req.file.id },
      },
      { upsert: true }
    )
      .exec()
      .then((result) => {
        res.status(200).json({
          message: "Photo updated",
        });
      })

      .catch((err) => {
        res.status(500).json({
          message: "Not Uploaded",
          error: err,
        });
      });
  }
);

////////////////////////////////////

router.post("/login", (req, res, next) => {
  User.find({ email: req.body.email })
    .then((user) => {
      if (user.length < 1) {
        return res.status(200).json({
          message: "Auth failed",
        });
      }
      if (!user[0].emailVerified) {
        return res.status(200).json({
          message: "Check your email for email verification",
        });
      }
      if (user[0].ban.action) {
        return res.status(200).json({
          message: `Your account is temporarily closed due to ${user[0].ban.reason}`,
        });
      }
      if (user[0].pBan.action) {
        return res.status(200).json({
          message: `Your account is permanently closed due to ${user[0].pBan.reason}`,
        });
      }
      function isJson(str) {
        try {
          JSON.parse(str);
        } catch (e) {
          return false;
        }
        return true;
      }
      let otherDetails = {};
      if (isJson(req.body.otherDetails)) {
        otherDetails = JSON.parse(req.body.otherDetails);
      } else {
        res.status(200).json({
          message: "something went wrong",
        });
      }

      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(200).json({
            message: "Password or Email is wrong",
          });
        }

        if (result) {
          let loginDetails = user[0].logInDetails;
          if (user[0].logInDetails.length >= 21) {
            loginDetails = user[0].logInDetails.slice(
              1,
              user[0].logInDetails.length
            );
          }

          loginDetails.push({
            day: req.body.day,

            time: new Date(),
            device: req.body.deviceType,
            otherDetails: otherDetails,
          });
          User.updateOne(
            { _id: user[0]._id },
            {
              logInDetails: loginDetails,
              $push: {
                activity: {
                  action: "login",
                  link: `https://civil.problemspotter.com/user/details/${
                    user[0].fName + "-" + user[0].lName
                  }/${user[0]._id}`,
                  date: new Date(),
                  day: new Date().getDay(),
                },
              },
            }
          )
            .then()
            .catch();

          const token = jwt.sign(
            {
              email: user[0].email,
              userId: user[0]._id,
              authType: user[0].authType,
              fName: user[0].fName,
              lName: user[0].lName,
              verified: user[0].verified,
              composeHandle: user[0].composeHandle,
              canApprove: user[0].canApprove,
            },
            process.env.JWT_TOKEN,
            {
              expiresIn: "12h",
            }
          );
          return res.status(200).json({
            message: "Auth Successful",
            token: token,
            authType: user[0].authType,
            email: user[0].email,
            userId: user[0]._id,
            fName: user[0].fName,
            lName: user[0].lName,
            composeHandle: user[0].composeHandle,
            canApprove: user[0].canApprove,
          });
        }
        res.status(200).json({
          message: "Auth failed , check your password and email",
        });
      });
    })
    .catch((err) => {
      res.status(404).json({
        message: "Auth Failed",
        error: err,
      });
    });
});

////////////////////////////////////////////////

router.get("/adminProfileGetter", (req, res, next) => {
  User.find({ authType: "Admin" })
    .select("profileImage fName lName")
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      error: err;
    });
});
/////////////////////////////////////////////

router.get("/identifier/details/:id", (req, res) => {
  const id = req.params.id;

  User.findById(id)
    .then((result) => {
      Statement.find({ userId: id })
        .then((result1) => {
          res.status(200).json({
            userDetails: result,
            StatementUploaded: result1,
          });
        })
        .catch();
    })
    .catch((err) => {
      res.status(404).json({
        error: err,
      });
    });
});

///////////////////////////////////////////////////////

router.patch("/number/verification", checkAuth, (req, res) => {
  const id = req.body.userId;
  const number = req.body.number;
  User.updateOne(
    { _id: ObjectId(id) },
    { $set: { numberVerified: true, number: number } },
    { upsert: true }
  )
    .then((result) => {
      return res.status(200).json({
        message: "Number verified successfully",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({
        message: "something went wrong",
      });
    });
});

///////////////////////////////////////////////////////
router.get("/savedStatemnets/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.findById(id)
    .exec()
    .then((result) => {
      res.status(200).json({
        savedStatements: result.savedStatements,
      });
    })
    .catch();
});

module.exports = router;
