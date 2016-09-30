var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = require('./user');
var convoSchema = require('./conversation');

var messageSchema = new Schema({
  text: {
              type: String,
              required:true
            },
  user: {type : mongoose.Schema.ObjectId, ref : 'User'},
  dateCreated: {
              type: Date,
              default: Date.now
            }
});

module.exports = mongoose.model('Message', messageSchema);