var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var convoSchema = require('./conversation');
var userSchema = new Schema({
  firstName: {type: String, required:true},
  lastName: {type: String, required: true},
  age: {type: Number, required: true},
  cuid: {type: String, required: true},
  gender: {type: String, enum: ['Male', 'Female'], required: true},
  location: {type: String, required: true},
  available: {type: Boolean, required: true},
  lastClickedChats: {type: Date, default: Date.now},
  dateCreated: {type: Date, default: Date.now},
  previousChats: [String],
  rejects: [String],
  likes: [String],
  conversations: [ {type : mongoose.Schema.ObjectId, ref : 'Convo'} ],
  lastConvo: {},
  facebook: {}
});

module.exports = mongoose.model('User', userSchema);