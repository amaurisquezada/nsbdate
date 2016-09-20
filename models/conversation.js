var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = require('./user');
var messageSchema = require('./message');

var convoSchema = new Schema({
  messages: [ messageSchema ],
  user1: [ userSchema ],
  user2: [ userSchema ],
  dateCreated: {
              type: Date,
              default: Date.now
            }
});

module.exports = mongoose.model('Conversation', convoSchema);