const mongoose = require("mongoose");

const uploadSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  statementImage: { type: String },
  profileImage: { type: String },
});

const Upload = mongoose.model("Upload", uploadSchema);
module.exports = Upload;
