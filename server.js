var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
require('babel-register');
var mongoose = require('mongoose');
var User = require('./models/user');
var Conversation = require('./models/conversation');
var Message = require('./models/message');
var swig  = require('swig');
var React = require('react');
var ReactDOM = require('react-dom/server');
var Router = require('react-router');
var routes = require('./app/routes');
var config = require('./config');
var async = require('async');
var request = require('request');
var xml2js = require('xml2js');
var _ = require('underscore');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
require('dotenv').config();
var cuid = require('cuid')
var ExpressPeerServer = require('peer').ExpressPeerServer;

var menSeekingWomen = []
var womenSeekingMen = []
var connectedUsers = []

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

app.put('/api/amtc', function(req, res, next) {
  console.log(req.body, "req check from server")
  var id = req.body.convoId
  Conversation.findById(id, function(err, convo) {
    if (err) return next(err);
      console.log(err)
    if (!convo) {
      return res.status(404).send({ message: 'Convo not found.' });
    }
    var message = new Message({
      text: req.body.text,
      user: req.body.authorId
    });
    message.save()
    convo.messages.push(message)
    convo.save()
    res.status(200).send({ message: 'Message Added.' })
  });
});




app.get('/api/currentUser', function(req, res, next) {
	console.log(req._parsedOriginalUrl.query)
	User
			.findOne({'firstName': req._parsedOriginalUrl.query})
			.exec(function(err, user) {
      if (err) return next(err);
      req.session.user = user
      res.send(user);
    });
  // if(req.session.passport){
  //   return res.send(req.session.passport.user);
  // }
});


app.post('/api/signout', function(req, res){
  console.log(req.session, "before logout")
  req.logout()
  console.log(req.session, "after logout")
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
      console.log(err)
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    user.gender = req.body.gender
    user.age = req.body.age
    user.save()
  });
});

app.put('/api/atpc', function(req, res, next) {
  var id = req.body.myId
  User.findOne({ cuid: id }, function(err, user) {
    if (err) return next(err);
      console.log(err)
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    user.previousChats.push(req.body.peerId)
    user.save()
    res.status(200).send({ message: 'User updated.' })
  });
});





var server = require('http').createServer(app);


var options = {
    debug: true
}


app.use('/connect', ExpressPeerServer(server, options));
 
var io = require('socket.io')(server);

io.sockets.on('connection', function(socket){
  console.log("New user conncected")
  connectedUsers.push(socket)

socket.on('disconnect', function(){
  connectedUsers.pop();
  if (connectedUsers.length < 1){
    womenSeekingMen = [];
  }
})

socket.on('addToWsm', function(payload){
  console.log(payload)
  womenSeekingMen.push(payload)
  console.log(womenSeekingMen, "from server side socket")
  // this.broadcast.emit('step1', payload)
})

socket.on('fetchFromWsm', function(payload){
  var self = this
  User.findOne({ cuid: payload }, function(err, user) {
    if (err) return next(err);
      console.log(err)
    if (!user) {
      console.log('User not found.');
    }
    console.log(womenSeekingMen, "before splice")
    var chatHistory = user.previousChats
    var eligible = _.filter(womenSeekingMen, function(pm){ return !_.contains(chatHistory, pm.peerCuid)})[0]
    console.log(eligible, 'eligible from fetch')
    if (eligible) {
      var selection = womenSeekingMen.splice(womenSeekingMen.indexOf(eligible), 1)[0]
      console.log(womenSeekingMen, "after splice")
      self.emit('idRetrieval', selection)  
    } else {
      self.emit('noEligibleUsers')
    }
  })
})

// socket.on('dust', function() {
//   this.join('amauris')
// })

socket.on('rejected', function(payload) {
  this.broadcast.to('/#' + payload).emit('closeEvent')
})

socket.on('liked', function(payload) {

  User.findOne({ cuid: payload.myId }, function(err, user) {
    if (err) return next(err);
      console.log(err)
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    user.likes.push(payload.peerId)
    user.save()
  });

  this.broadcast.to('/#' + payload.peerSocket).emit('makeSelection')
})

socket.on('sendSocket', function(payload) {
  this.broadcast.to('/#'+ payload.destination).emit('peerSocket', payload.socketId)
})

socket.on('likeToo', function(payload){
  var female = payload.myGender == "Female" ? payload.myId : payload.peerId;
  var male = payload.myGender == "Male" ? payload.myId : payload.peerId;
  var user1, user2;

  User.findOne({ cuid: female }, function(err, user) {
    if (err) return next(err);
      console.log(err)
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    user1 = user;


  User.findOne({ cuid: male }, function(err, otherUser) {
    if (err) return next(err);
      console.log(err)
    if (!otherUser) {
      return res.status(404).send({ message: 'User not found.' });
    }
    user2 = otherUser;
    var convo = new Conversation({
      user1: user1,
      femaleFn: user1.firstName,
      user2: user2,
      maleFn: user2.firstName
    });
    convo.save();
    user.conversations.push(convo);
    otherUser.conversations.push(convo);
    user.save();
    otherUser.save();
  });
});

  this.broadcast.to('/#'+ payload.peerSocket).emit('newMatch', {})
})

socket.on('subscribe', function(room) { 
        console.log('joining room', room);
        socket.join(room); 
})

socket.on('newMessage', function(payload){
  Conversation.findById(payload.convoId, function(err, convo) {
    if (err) return next(err);
      console.log(err)
    var message = new Message({
      text: payload.text,
      user: payload.authorId
    });
    message.save()
    convo.messages.push(message)
    convo.save()
    io.to(payload.convoId).emit('updateMessages', convo)
  });
})


})

server.listen(app.get('port'), function() {
  console.log('Peer Express server listening on port ' + app.get('port'));
});


app.use(function(req, res) {
  Router.match({ routes: routes.default, location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message)
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      var html = ReactDOM.renderToString(React.createElement(Router.RoutingContext, renderProps));
      var page = swig.renderFile('views/index.html', { html: html });
      res.status(200).send(page);
    } else {
      res.status(404).send('MOWDEEEE')
    }
  });
});

/**
 * GET /api/characters/shame
 * Returns 100 lowest ranked characters.
 */
// app.get('/api/characters/shame', function(req, res, next) {
//   Character
//     .find()
//     .sort('-losses')
//     .limit(100)
//     .exec(function(err, characters) {
//       if (err) return next(err);
//       res.send(characters);
//     });
// });


/**
 * GET /api/characters/:id
 * Returns detailed character information.
 */


/**
 * POST /api/report
 * Reports a character. Character is removed after 4 reports.
 */
// app.post('/api/report', function(req, res, next) {
//   var characterId = req.body.characterId;

//   Character.findOne({ characterId: characterId }, function(err, character) {
//     if (err) return next(err);

//     if (!character) {
//       return res.status(404).send({ message: 'Character not found.' });
//     }

//     character.reports++;

//     if (character.reports > 4) {
//       character.remove();
//       return res.send({ message: character.name + ' has been deleted.' });
//     }

//     character.save(function(err) {
//       if (err) return next(err);
//       res.send({ message: character.name + ' has been reported.' });
//     });
//   });
// });

/**
 * GET /api/stats
 * Returns characters statistics.
 */
// app.get('/api/stats', function(req, res, next) {
//   async.parallel([
//       function(callback) {
//         Character.count({}, function(err, count) {
//           callback(err, count);
//         });
//       },
//       function(callback) {
//         Character.count({ race: 'Amarr' }, function(err, amarrCount) {
//           callback(err, amarrCount);
//         });
//       },
//       function(callback) {
//         Character.count({ race: 'Caldari' }, function(err, caldariCount) {
//           callback(err, caldariCount);
//         });
//       },
//       function(callback) {
//         Character.count({ race: 'Gallente' }, function(err, gallenteCount) {
//           callback(err, gallenteCount);
//         });
//       },
//       function(callback) {
//         Character.count({ race: 'Minmatar' }, function(err, minmatarCount) {
//           callback(err, minmatarCount);
//         });
//       },
//       function(callback) {
//         Character.count({ gender: 'Male' }, function(err, maleCount) {
//           callback(err, maleCount);
//         });
//       },
//       function(callback) {
//         Character.count({ gender: 'Female' }, function(err, femaleCount) {
//           callback(err, femaleCount);
//         });
//       },
//       function(callback) {
//         Character.aggregate({ $group: { _id: null, total: { $sum: '$wins' } } }, function(err, totalVotes) {
//             var total = totalVotes.length ? totalVotes[0].total : 0;
//             callback(err, total);
//           }
//         );
//       },
//       function(callback) {
//         Character
//           .find()
//           .sort('-wins')
//           .limit(100)
//           .select('race')
//           .exec(function(err, characters) {
//             if (err) return next(err);

//             var raceCount = _.countBy(characters, function(character) { return character.race; });
//             var max = _.max(raceCount, function(race) { return race });
//             var inverted = _.invert(raceCount);
//             var topRace = inverted[max];
//             var topCount = raceCount[topRace];

//             callback(err, { race: topRace, count: topCount });
//           });
//       },
//       function(callback) {
//         Character
//           .find()
//           .sort('-wins')
//           .limit(100)
//           .select('bloodline')
//           .exec(function(err, characters) {
//             if (err) return next(err);

//             var bloodlineCount = _.countBy(characters, function(character) { return character.bloodline; });
//             var max = _.max(bloodlineCount, function(bloodline) { return bloodline });
//             var inverted = _.invert(bloodlineCount);
//             var topBloodline = inverted[max];
//             var topCount = bloodlineCount[topBloodline];

//             callback(err, { bloodline: topBloodline, count: topCount });
//           });
//       }
//     ],
//     function(err, results) {
//       if (err) return next(err);

//       res.send({
//         totalCount: results[0],
//         amarrCount: results[1],
//         caldariCount: results[2],
//         gallenteCount: results[3],
//         minmatarCount: results[4],
//         maleCount: results[5],
//         femaleCount: results[6],
//         totalVotes: results[7],
//         leadingRace: results[8],
//         leadingBloodline: results[9]
//       });
//     });
// });




