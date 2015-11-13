var querystring = require('querystring');

var spotify = require('./spotifyInt.js');
var songkick = require('./songkickInt.js');
var util = require('./utils.js');

var query = require('./db/dbHelper.js');

var database = require('./db/dummyDataHandler_laura.js');



module.exports.callback = function(req, res) {
  var code = req.query.code;
  spotify.getToken(code)
    .then(function(access_token, refresh_token) {
      return spotify.findUser(access_token)
        .then(function(userID) {
          res.cookie("userID", userID, {
            maxAge: 900000,
            httpOnly: true
          });
          return database.addUserToDatabase(access_token, refresh_token, userID)
            // return util.generateSession(req, access_token, refresh_token, userID)
            .then(function() {
              res.redirect('/');
            });
        })
        .catch(function(err) {
          console.log('OH NO (in /callback) ' + err);
        });
    })
    .catch(function() {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    });
};

module.exports.myConcerts = function(req, res) {
  database.findUserInDatabase(req.cookies.userID)
    .then(function(userData) {

      var userID = userData[0].userID;
      var token = userData[0].access_token;
      var location = req.query.location;

      spotify.getPlaylists(token, userID)
        .then(function(playlists) {
          return spotify.getTracks(token, userID, playlists);
        }).then(function(tracks) {
          return spotify.getArtists(tracks);
        }).then(function(artists) {
          return songkick.findMyMetroArea(location)
            .then(function(metroID) {
              return songkick.findConcerts(metroID);
            }).then(function(concerts) {
              return util.findMyConcerts(artists, concerts);
            }).then(function(myShows) {
              res.json(myShows);
            });
        });
    });
};

module.exports.suggestedConcerts = function(req, res) {

};

module.exports.myArtists = function(req, res) {
  var token = req.session.accessToken;
  spotify.getMyArtists(token).then(function(artists) {
    //blah blah blah
  })
};
