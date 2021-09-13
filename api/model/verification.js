const mongoose = require("mongoose");

const userVerificationSchema = mongoose.Schema({
  _id: String,
  users: Array,
});

const verify = mongoose.model("Verify", userVerificationSchema);
module.exports = verify;
