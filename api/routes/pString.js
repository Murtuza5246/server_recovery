const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const PString = require("../model/pString");
const app = express();
///////////////////////////////

router.post("/private/make", (req, res) => {
  const pstring = new PString({
    _id: new mongoose.Types.ObjectId(),
    pString: req.body.pString,
  });
  pstring
    .save()

    .then((result) => {
      res.status(200).json({
        message: "Created",
      });
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
        message: "not created",
      });
    });
});

///////////////////////////////

router.patch("/private/:pString", (req, res, next) => {
  const string = req.params.pString;

  PString.find({ pString: string })
    .exec()
    .then((result) => {
      const length = result.length !== 0;
      if (length) {
        PString.updateOne({ pString: string }, { $set: { pString: "used" } })
          .then()
          .catch();
        res.status(200).json(length);
      } else {
        res.status(401).json(false);
      }
    })
    .catch();
});

//////////////////////
module.exports = router;
