require('babel-register');
require('dotenv').config();
var _ = require('underscore'),
    async = require('async'),
    bodyParser = require('body-parser'),
    config = require('./config'),
    Conversation = require('./models/conversation'),
    cuid = require('cuid'),
    express = require('express'),
    favicon = require('serve-favicon'),
    ExpressPeerServer = require('peer').ExpressPeerServer,
    logger = require('morgan'),
    Message = require('./models/message'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    path = require('path'),
    React = require('react'),
    ReactDOM = require('react-dom/server'),
    Router = require('react-router'),
    routes = require('./app/routes'),
    Strategy = require('passport-facebook').Strategy,
    swig  = require('swig'),
    User = require('./models/user'),
    allConnectedMen = [],
    allConnectedWomen = [],
    connectedUsers = [],
    menSeekingWomen = [],
    womenSeekingMen = [];

//MongoDB Connection.
mongoose.Promise = global.Promise;
mongoose.connect(config.database);
mongoose.connection.on('error', function() {
  console.info('Error: Could not connect to MongoDB. Did you forget to run `mongod`?');
});

//Passport strategy for the facebook login.
passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://nsbdate.com:3000/login/facebook/return'
  },

  //Function that handles the return from FB. Either signs-in the user if he/she is in the DB or creates the new user. 
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({'facebook.id': profile.id}, function(err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                user = new User({
                    firstName: profile.displayName.split(" ")[0],
                    lastName: profile.displayName.split(" ")[1],
                    age: 21,
                    cuid: cuid(),
                    gender: "Female",
                    location: "New York City",
                    available: false,
                    lastClickedChats: new Date(),
                    previousChats: [],
                    likes: [],
                    conversations: [],
                    lastConvo: {},
                    facebook: profile._json
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return cb(err, user);
                });
            } else {
                return cb(err, user);
            }
        });
  }
));

//Serializes and deserializes the user for use in the session.
passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (user, cb) {
    User.findById(user, function (err, user) {
        cb(err, user);
    });
});

//Express middleware
var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/img/favicon.png'));
app.use(require('express-session')({ secret: 'keyboard kitten', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/users', function(req, res, next) {
  User.find()
    .exec(function(err, users) {
      if (err) return next(err);
      if (users.length > 0) {
        return res.send(users);
      }
    });
});

//Api to retrieve all the user's conversations for the Chat component.

app.get('/api/get-convos', function(req, res, next) {
  // var id = req.session.user._id;
  var id = req.session.passport.user._id;
  Conversation
      .find({ $or: [{user1: id}, {user2: id}] })
      .exec(function(err, convo) {
            if (err) return next(err);
            res.send(convo);
        });
});

//Api to retrieve user's last conversations so that it is in focus when user revisits.

app.get('/api/get-last-convo', function(req, res, next){
  // var id = req.session.user._id;
  var id = req.session.passport.user._id;
  User.findById(id, function(err, user) {
    if (err) return next(err);
    if (!_.isEmpty(user.lastConvo)) {
      Conversation.findById(user.lastConvo._id, function(err2, convo) {
        if (err2) return next(err2);
        res.send({lastConvo: user.lastConvo._id, lastClicked: user.lastConvo.lastClicked, currentConvo: convo});
      });
    } else if (user.conversations.length === 0){
        res.send({lastConvo: "", lastClicked: "", currentConvo: ""});
      } else {
          Conversation.findById(user.conversations[0], function(err2, convo) {
            if (err2) return next(err2);
            res.send({lastConvo: convo._id, lastClicked: Date.now(), currentConvo: convo});
          });
        }
  });
});

//Api to add a new message to the conversation sent in the request.

app.put('/api/amtc', function(req, res, next) {
  var id = req.body.convoId;
  Conversation.findById(id, function(err, convo) {
    if (err) return next(err);
    if (!convo) {
      return res.status(404).send({message: 'Convo not found.'});
    }
    var message = new Message({
      text: req.body.text,
      user: req.body.authorId
    });
    message.save();
    convo.messages.push(message);
    convo.save();
    res.status(200).send({message: 'Message Added.'});
  });
});

//Retrieves current user after the facebook login.

app.get('/api/currentUser', function(req, res, next) {
	// User
	// 		.findOne({'firstName': req._parsedOriginalUrl.query})
	// 		.exec(function(err, user) {
 //      if (err) return next(err);
 //      req.session.user = user;
 //      res.send(user);
 //    });
  if(req.session.passport){
    return res.send(req.session.passport.user);
  }
});

//Api to retrieve the user's previous chats for the video component. Necessary because users many not video match with other users they have
//already confrenced with.

app.get('/api/rpc', function(req, res, next) {
  // var id = req.session.user.cuid;
  var id = req.session.passport.user.cuid;
  User.findOne({ cuid: id }, function(err, user) {
    if (err) return next(err);
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    res.send(user.previousChats);
  });
});

//Api to retrieve appropriate number of badge notifications for the Chat button in the NavBar. Total notifications are the sum
//of conversations and messages newer than the last time the Chat component was clicked. 

app.get('/api/get-notifications', function(req, res, next) {
  // var id = req.session.user._id;
  // var id = req._parsedOriginalUrl.query;
  var id = req.session.passport.user._id;
  User.findOne({ _id: id }, function(err, user) {
    if (err) return next(err);
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    var stack = [],
        lastClickedChats = user.lastClickedChats;

    stack.push(function (callback) {
      Conversation.find({
        $and: [
          { $or: [{user1: id}, {user2: id}] },
          {dateCreated: { $gt: lastClickedChats}}
        ]
      }, function(err, results){
           callback(null, results.length);
         });
    });

    stack.push(function (callback){
      Message.find({'recipient': id, dateCreated: { $gt: lastClickedChats}}, function (err, results){
        callback(null, results.length);
      })
    });

    async.parallel(stack, function(err, result){
      if (err) {
        console.log(err)
        return;
      }
      var sum = result.reduce(function(a, b){return a + b}, 0);
      res.send({amount:sum});
    });
  });
});


app.post('/api/signout', function(req, res){
  req.logout()
  res.redirect('/')
})


//Passport's facebook authentication handling.

app.get('/login/facebook', passport.authenticate('facebook'));

app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    if(req.session.passport.user.dateCreated.getTime() + 60000 > Date.now()) {
      res.redirect('/newuser');
    }else {
      res.redirect('/');
    }
});


app.get('/', require('connect-ensure-login').ensureLoggedIn());

app.get('/')

app.put('/api/user/:id', function(req, res, next) {
  var id = req.session.user_id;
  User.findOne({ id: id }, function(err, user) {
    if (err) return next(err);
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    user.gender = req.body.gender;
    user.age = req.body.age;
    user.save();
  });
});

//Api adds matched users to current user's 'previousChats' attribute.

app.put('/api/atpc', function(req, res, next) {
  var id = req.body.myId;
  User.findOne({ cuid: id }, function(err, user) {
    if (err) return next(err);
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    _.contains(user.previousChats, req.body.peerId) ? null : user.previousChats.push(req.body.peerId);
    user.save();
    res.send(user.previousChats);
  });
});


//Peer.js server connection.

var server = require('http').createServer(app),
    options = {debug: true};

app.use('/connect', ExpressPeerServer(server, options));

var io = require('socket.io')(server);

//Socket event listeners.

io.sockets.on('connection', function(socket){

  //When socket disconnects, the appropriate user is removed from the server variables that manage connected users. Also emits an event to 
  //opposite sex to relay a user change.

  socket.on('disconnect', function(){
    var clientId = this.id.substring(2),
    cuid = this.cuid;
    if (this.gender == "male"){
      allConnectedMen = _.reject(allConnectedMen, function(el) { return el.cuid === cuid; });
      menSeekingWomen = _.reject(menSeekingWomen, function(el) { return el.cuid === cuid; });
      io.to('femaleRoom').emit("usersChange", cuid);
    } else if (this.gender == "female") {
        allConnectedWomen = _.reject(allConnectedWomen, function(el) { return el.peerCuid === cuid; });
        womenSeekingMen = _.reject(womenSeekingMen, function(el) { return el.peerCuid === cuid; });
        io.to("maleRoom").emit('usersChange', cuid);
      }
  });

  //Socket joins room dependent on the user's gender.

  socket.on('joinRoom', function(user){
    if (user.gender === "Female"){
      this.gender = "female";
      this.cuid = user.cuid;
      this.join('femaleRoom');
    } else {
        this.gender = "male";
        this.cuid = user.cuid;
        this.join('maleRoom');
      }
  });

  //Matching logic for female users.

  socket.on('addToWsm', function(payload){
    var self = this, newSignIn, addedToWsm, notMatched;
    if(!_.findWhere(allConnectedWomen, payload)){
      allConnectedWomen.push(payload);
      newSignIn = true;
    }
    User.findOne({ cuid: payload.peerCuid }, function(err, user) {
      if (err) return next(err);
      if (!user) {
        console.log('User not found.');
      }
      var chatHistory = user.previousChats,
          eligible = _.filter(menSeekingWomen, function(pm){ return !_.contains(chatHistory, pm.cuid)})[0],
          connectedEligible = _.filter(allConnectedMen, function(pm){ return !_.contains(chatHistory, pm.cuid)})[0];
      if (eligible) {
        menSeekingWomen.splice(menSeekingWomen.indexOf(eligible), 1);
        self.broadcast.to(eligible.socket).emit('idRetrieval', payload);
        notMatched = false;
      } else {
          connectedEligible ? self.emit("notAvailable") : self.emit('noEligibleUsers');
          if (!_.findWhere(womenSeekingMen, payload)){
            womenSeekingMen.push(payload);
            addedToWsm = true;
            notMatched = true;
          }
        }
      if ((newSignIn) || (addedToWsm && notMatched)){
        eligible ? io.to("maleRoom").emit('usersChange', eligible.cuid) : io.to("maleRoom").emit('usersChange', user.cuid);
      }
    })
  })

  //Matching logic for male users.

  socket.on('fetchFromWsm', function(payload){
    var self = this, selection, newSignIn, addedToMsw, notMatched;
    if(!_.findWhere(allConnectedMen, payload)){
      allConnectedMen.push(payload)
      newSignIn = true
    }
    User.findOne({ cuid: payload.cuid }, function(err, user) {
      if (err) return next(err);
      if (!user) {
        console.log('User not found.');
      }
      var chatHistory = user.previousChats,
          eligible = _.filter(womenSeekingMen, function(pm){ return !_.contains(chatHistory, pm.peerCuid)})[0],
          connectedEligible = _.filter(allConnectedWomen, function(pm){ return !_.contains(chatHistory, pm.peerCuid)})[0],
          thisUser = _.filter(menSeekingWomen, function(pm){ return !_.contains(chatHistory, pm.cuid)})[0];
      if (eligible) {
        selection = womenSeekingMen.splice(womenSeekingMen.indexOf(eligible), 1)[0];
        // menSeekingWomen.splice(menSeekingWomen.indexOf(thisUser), 1)
        self.emit('idRetrieval', selection);
        notMatched = false;
      } else {
          connectedEligible ? self.emit('notAvailable') : self.emit('noEligibleUsers');
          if (!_.findWhere(menSeekingWomen, payload)){
              menSeekingWomen.push(payload);
              addedToMsw = true;
              notMatched = true;
          }
        }
      if ((newSignIn) || (addedToMsw && notMatched)){
         selection ? io.to('femaleRoom').emit('usersChange', selection.peerCuid) : io.to('femaleRoom').emit('usersChange', user.cuid);
      }
    });
  });

  //Event handler for when a user rejects a matched user.

  socket.on('rejected', function(payload) {
    var id = this.id.substring(2);
    this.broadcast.to('/#' + payload).emit('closeEvent', id);
  })

  //Event handler for when a user likes a matched user. Initial liker sends a selection request to the macthed user.

  socket.on('liked', function(payload) {
    User.findOne({ cuid: payload.myId }, function(err, user) {
      if (err) return next(err);
      if (!user) {
        return res.status(404).send({ message: 'User not found.' });
      }
      user.likes.push(payload.peerId);
      user.save();
    });
    this.broadcast.to('/#' + payload.peerSocket).emit('makeSelection');
  });

  socket.on('sendSocket', function(payload) {
    this.broadcast.to('/#'+ payload.destination).emit('peerSocket', payload.socketId);
  })

  //Event handler for when a user who has been liked reciprocates a like. A conversation with both participants is created and an
  //event to update both user's badge notifications is emitted.

  socket.on('likeToo', function(payload){
    var female = payload.myGender == "Female" ? payload.myId : payload.peerId,
        male = payload.myGender == "Male" ? payload.myId : payload.peerId,
        user1,
        user2;
    User.findOne({ cuid: female }, function(err, user) {
      if (err) return next(err);
      if (!user) {
        return res.status(404).send({ message: 'User not found.' });
      }
      user1 = user;
      User.findOne({ cuid: male }, function(err, otherUser) {
        if (err) return next(err);
        if (!otherUser) {
          return res.status(404).send({ message: 'User not found.' });
        }
        user2 = otherUser;
        var lc = {},
            date = Date.now();
        lc[user1._id] = date - 10;
        lc[user2._id] = date - 10;
        var convo = new Conversation({
          user1: user1,
          femaleFn: user1.firstName,
          user2: user2,
          maleFn: user2.firstName,
          lastClicked : lc,
          messages: [],
          dateCreated: date
        });
        convo.save().then(function(convo){
          var user1 = convo.user1._id,
            user2 = convo.user2._id;
            console.log(user1, "user1 from conversation save")
            console.log(user2, "user2 from conversation save")
          io.to(user1).emit('updateNotifications', user1);
          io.to(user2).emit('updateNotifications', user2);
        });
        user.conversations.push(convo);
        otherUser.conversations.push(convo);
        user.save();
        otherUser.save();
      });
    });
  });

  //Event to help synchronize video confrencing timers for both users.

  socket.on('timerEvent', function(payload) {
    this.join(payload.user1 + payload.user2);
    setTimeout(function(){
      io.to(payload.user1 + payload.user2).emit("startTimer");
    }, 3000);
  });

  //Sets the current conversation's lastCLicked attribute for the current user.
  //Each conversation has a lastClicked attribute for each user to help facilitate how new message notifications are rendered in 
  //the chat component.

  socket.on('setLastConvo', function(payload){
    var _this = this;
    User.findById(payload.userId, function(err, user) {
      if (err) return next(err);
      user.lastConvo = payload.lastConvo;
      user.save();
    });
    var lcString = 'lastClicked.' + payload.userId,
        updatedAttr = {};
    updatedAttr[lcString] = payload.lastConvo.lastClicked;
    Conversation.findByIdAndUpdate(payload.lastConvo._id, {$set: updatedAttr}, {new: true}, function(err, convo) {
      if (err) return next(err);
      _this.emit('updatedConvo', convo);
    });
  });

  socket.on('subscribe', function(room) { 
    socket.join(room); 
  });

  socket.on('updateUserLastClick', function(userId){
    User.findByIdAndUpdate(userId, {$set: {lastClickedChats: Date.now()}}, {new: true}, function(err, user) {
      if (err) return next(err);
    }); 
  });

  //Sets the current conversation's lastCLicked attribute for the current user.
  //Each conversation has a lastClicked attribute for each user to help facilitate how new message notifications are rendered in 
  //the chat component.

  socket.on('updateLastClicked', function(payload) {
    var lcString = 'lastClicked.' + payload.userId,
        updatedAttr = {};
    updatedAttr[lcString] = Date.now();
    Conversation.findByIdAndUpdate(payload.convoId, {$set: updatedAttr}, {new: true}, function(err, convo) {
      if (err) return next(err);
    });
  });

  //Socket handler for when a user sends a message to another user. The message is created, added to the conversation and two events are
  //emitted. One to trigger a re-render on the Chat compnonent. The other to update the notifications badge if the recipient user is
  //not currently in the Chat component.

  socket.on('newMessage', function(payload){
    Conversation.findById(payload.convoId, function(err, convo) {
      if (err) return next(err);
      var message = new Message({
        text: payload.text,
        user: payload.authorId,
        recipient: payload.recipient
      });
      message.save();
      convo.messages.push(message);
      convo.save().then(function(convo){
        io.to(payload.convoId).emit('updateMessages', convo);
        io.to(payload.recipient).emit('updateNotifications', payload.recipient);
      });
    });
  });

});

server.listen(app.get('port'), function() {
  console.log('Peer Express server listening on port ' + app.get('port'));
});

//Sets app's routing using the react router.

app.use(function(req, res) {
  Router.match({ routes: routes.default, location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message);
    } else if (redirectLocation) {
        res.status(302).redirect(redirectLocation.pathname + redirectLocation.search);
      } else if (renderProps) {
          var html = ReactDOM.renderToString(React.createElement(Router.RoutingContext, renderProps)),
              page = swig.renderFile('views/index.html', { html: html });
          res.status(200).send(page);
        } else {
            res.status(404).send('Page Not Found');
          }
  });
});