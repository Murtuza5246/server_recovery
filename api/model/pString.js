const mongoose = require("mongoose");

const pStringSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  pString: { type: String },
});

const PString = mongoose.model("pStrings", pStringSchema);
module.exports = PString;
