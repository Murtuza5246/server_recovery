const mongoose = require("mongoose");

const commentsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  questionId: { type: String },
  uploadedByName: { type: String, required: true },
  uploadedByEmail: { type: String, required: true },
  question: { type: String, required: true },
  comments: { type: Array },
  profileImage: { type: String },
  time: { type: String },
  date: { type: String },
});

const Comments = mongoose.model("Comment", commentsSchema);
module.exports = Comments;
