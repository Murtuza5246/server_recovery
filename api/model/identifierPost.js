const mongoose = require("mongoose");

const identifierPostSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  uploadedByName: { type: String },
  uploadedByEmail: { type: String },
  postContent: { type: Object },
  comments: { type: Array },
  images: { type: Array },
  time: { type: String },
  youTubeLink: { type: String },
  date: { type: String },
  authType: { type: String },
  userId: { type: String },
  likes: { type: Array },
  mentions: { type: Array },
  onlyMe: { type: Boolean },
});

const IdentifierPost = mongoose.model("identifierPost", identifierPostSchema);
module.exports = IdentifierPost;
