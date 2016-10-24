require('babel-register');
require('dotenv').config();
var _ = require('underscore'),
    async = require('async'),
    bodyParser = require('body-parser'),
    config = require('./config'),
    Conversation = require('./models/conversation'),
    cuid = require('cuid'),
    express = require('express'),
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

mongoose.connect(config.database);
mongoose.connection.on('error', function() {
  console.info('Error: Could not connect to MongoDB. Did you forget to run `mongod`?');
});

// passport.use(new Strategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: 'http://localhost:3000/login/facebook/return'
//   },

//   function(accessToken, refreshToken, profile, cb) {
//     User.findOne({'facebook.id': profile.id}, function(err, user) {
//             if (err) {
//                 return cb(err);
//             }
//             //No user was found... so create a new user with values from Facebook (all the profile. stuff)
//             if (!user) {
//                 user = new User({
//                     firstName: profile.displayName.split(" ")[0],
//                     lastName: profile.displayName.split(" ")[1],
//                     age: 21,
//                     cuid: cuid(),
//                     gender: "Female",
//                     location: "New York City",
//                     available: false,
//                     previousChats: [],
//                     facebook: profile._json
//                 });
//                 user.save(function(err) {
//                     if (err) console.log(err);
//                     return cb(err, user);
//                 });
//             } else {
//                 //found user. Return
//                 return cb(err, user);
//             }
//         });
//   }
// ));


// passport.serializeUser(function (user, cb) {
//     cb(null, user);
// });

// passport.deserializeUser(function (user, cb) {
//     //If using Mongoose with MongoDB; if other you will need JS specific to that schema
//     User.findById(user, function (err, user) {
//         cb(err, user);
//     });
// });


var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')({ secret: 'keyboard kitten', resave: false, saveUninitialized: true }));



// app.use(passport.initialize());
// app.use(passport.session());


app.get('/api/users', function(req, res, next) {
  User.find()
    .exec(function(err, users) {
      if (err) return next(err);
      if (users.length > 0) {
        return res.send(users);
      }
    });
});

app.get('/api/get-convos', function(req, res, next) {
  var gender = req.session.user.gender == "Male" ? "Male" : "Female"
  if (gender == "Male") {
      Conversation
          .find({'user2': req.session.user._id})
          .exec(function(err, convo) {
          if (err) return next(err);
          res.send(convo);
        });
    } else {
        Conversation
            .find({'user1': req.session.user._id})
            .exec(function(err, convo) {
            if (err) return next(err);
            res.send(convo);
          });
      }
});

app.get('/api/get-last-convo', function(req, res, next){
  User.findById(req.session.user._id, function(err, user) {
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




app.get('/api/currentUser', function(req, res, next) {
	User
			.findOne({'firstName': req._parsedOriginalUrl.query})
			.exec(function(err, user) {
      if (err) return next(err);
      req.session.user = user;
      res.send(user);
    });
  // if(req.session.passport){
  //   return res.send(req.session.passport.user);
  // }
});

app.get('/api/rpc', function(req, res, next) {
  var id = req.session.user.cuid;
  User.findOne({ cuid: id }, function(err, user) {
    if (err) return next(err);
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    res.send(user.previousChats);
  });
});

app.get('/api/get-notifications', function(req, res, next) {
  // var id = req.session.user._id,
  var id = req._parsedOriginalUrl.query;
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

// app.post('/api/wsm', function(req, res){
// 	console.log(req.body.cuid)
// 	womenSeekingMen.push(req.body.cuid)
// 	console.log(womenSeekingMen)
// })

// app.get('/api/get-woman-id', function(req, res, next){
// 	console.log(womenSeekingMen)
// })




// app.get('/login/facebook',
//   passport.authenticate('facebook'));

// app.get('/login/facebook/return', 
//   passport.authenticate('facebook', { failureRedirect: '/login' }),
//   function(req, res) {
//     if(req.session.passport.user.dateCreated.getTime() + 60000 > Date.now()) {
//       res.redirect('/newuser');
//     }else {
//       res.redirect('/');
//     }
//   });


// app.get('/', require('connect-ensure-login').ensureLoggedIn());

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


var server = require('http').createServer(app),
    options = {debug: true};

app.use('/connect', ExpressPeerServer(server, options));

var io = require('socket.io')(server);

io.sockets.on('connection', function(socket){
  socket.on('disconnect', function(){
    var id = this.id,
    clientId = id.substring(2),
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

  socket.on('rejected', function(payload) {
    var id = this.id.substring(2);
    this.broadcast.to('/#' + payload).emit('closeEvent', id);
  })

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

  socket.on('timerEvent', function(payload) {
    this.join(payload.user1 + payload.user2);
    setTimeout(function(){
      io.to(payload.user1 + payload.user2).emit("startTimer");
    }, 3000);
  });

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
        convo.save();
        user.conversations.push(convo);
        otherUser.conversations.push(convo);
        user.save();
        otherUser.save();
        setTimeout(function(){
          io.to(user1._id).emit('updateNotifications', user1._id);
          io.to(user2._id).emit('updateNotifications', user2._id);
        }, 200);
      });
    });
  });

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

  socket.on('updateLastClicked', function(payload) {
    var _this = this,
        lcString = 'lastClicked.' + payload.userId,
        updatedAttr = {};
    updatedAttr[lcString] = Date.now();
    Conversation.findByIdAndUpdate(payload.convoId, {$set: updatedAttr}, {new: true}, function(err, convo) {
      if (err) return next(err);
    });
  });

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
      convo.save();
      io.to(payload.convoId).emit('updateMessages', convo);
      setTimeout(function(){
        io.to(payload.recipient).emit('updateNotifications', payload.recipient);
      }, 200);
    });
  });
})

server.listen(app.get('port'), function() {
  console.log('Peer Express server listening on port ' + app.get('port'));
});


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