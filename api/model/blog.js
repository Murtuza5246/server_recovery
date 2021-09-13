const mongoose = require("mongoose");

const blogSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, require: true }, //name
  title: { type: String, required: true },
  article: { type: String, require: true },
  email: { type: String, required: true },

  imageUrl: { type: String },
  description: { type: String },
  date: { type: String },
  time: { type: String },
  privacy: { type: Boolean },
  profileImage: { type: String },
  comments: { type: Array },
  userId: { type: String, required: true },
});

const blog = mongoose.model("Blog", blogSchema);
module.exports = blog;
