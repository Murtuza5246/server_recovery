const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
	_id               : mongoose.Schema.Types.ObjectId,
	authType          : { type: String, required: true },
	email             : {
		type     : String,
		required : true,
		unique   : true,
		match    : /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
	},
	password          : {
		type     : String,
		required : true
	},
	fName             : { type: String, required: true },
	lName             : { type: String, required: true },
	pString           : { type: String },
	contact           : { type: Number },
	dob               : { type: String },
	cName             : { type: String },
	cAddress          : { type: String },
	city              : { type: String },
	nState            : { type: String },
	pCode             : { type: String },
	experience        : { type: String },
	creationDate      : { type: String },
	creationTime      : { type: String },
	profileImage      : { type: String },
	savedStatements   : { type: Array },
	profileImageId    : { type: String },
	OName             : { type: String },
	OAddress          : { type: String },
	field             : { type: String },
	about             : { type: Object },
	logInDetails      : { type: Array },
	verified          : { type: Boolean, Default: false },
	composeHandle     : { type: Boolean, Default: false },
	emailVerified     : { type: Boolean, Default: false },
	emailKey          : { type: String },
	forgetKey         : { type: String },
	rating            : { type: Array },
	followers         : { type: Array },
	instagram         : { type: String },
	activity          : { type: Array },
	facebook          : { type: String },
	following         : { type: Array },
	ban               : { type: Object },
	pBan              : { type: Object },
	numberVerified    : { type: Boolean },
	number            : { Type: String },
	canApprove        : { type: Boolean },
	notification      : { type: Array },
	incorrectAttempts : { type: Number },
	blockTime         : { type: Number }
});

const Order = mongoose.model('User', userSchema);
module.exports = Order;
