var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = require('./user');
var messageSchema = require('./message');

var convoSchema = new Schema({
  messages: [Schema.Types.Mixed],
  lastClicked: {},
  user1: {type : mongoose.Schema.ObjectId, ref : 'User'},
  femaleFn: {type: String},
  user2: {type : mongoose.Schema.ObjectId, ref : 'User'},
  maleFn: {type: String},
  dateCreated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Conversation', convoSchema);