const mongoose = require("mongoose");

const learnerPostSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  uploadedByName: { type: String },
  uploadedByEmail: { type: String },
  postContent: { type: Object },
  comments: { type: Array },
  images: { type: Array },
  time: { type: String },
  date: { type: String },
  youTubeLink: { type: String },
  authType: { type: String },
  userId: { type: String },
  doing: { type: String },
  at: { type: String },
  likes: { type: Array },
  mentions: { type: Array },
  onlyMe: { type: Boolean },
});

const LearnerPost = mongoose.model("learnerPost", learnerPostSchema);
module.exports = LearnerPost;
