const mongoose = require("mongoose");

const questionsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  uploadedByName: { type: String, required: true },
  uploadedByEmail: { type: String, required: true },
  question: { type: Object, required: true },
  comments: { type: Array },
  profileImage: { type: String },
  time: { type: String },
  date: { type: String },
  authType: { type: String, required: true },
  userId: { type: String },
  verified: { type: String },
  likes: { type: Array },
  liked: { type: Boolean, default: false },
  mentions: { type: Array },
});

const Question = mongoose.model("Question", questionsSchema);
module.exports = Question;
