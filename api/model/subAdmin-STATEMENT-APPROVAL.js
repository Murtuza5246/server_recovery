const mongoose = require("mongoose");

const subAdminSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  statementID:{type:String },
  approved:{type:Boolean},
  reject:{type:Boolean}
);

const statement = mongoose.model("SubAdmin", subAdminSchema);
module.exports = statement;
