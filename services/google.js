
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Download your OAuth2 configuration from the Google
const config = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');


passport.use(new GoogleStrategy({
    clientID: config.web.client_id,
    clientSecret: config.web.client_secret,
    callbackURL: "http://localhost/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOne({
      'provider_id': profile.id
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        user = new User({
          provider_id: profile.id,
          user_name: profile.displayName,
          email: profile.emails[0].value,
          first_name: profile.name.givenName,
          last_name: profile.name.familyName
        });
        if (profile.photos.length) {
          user.picture = profile.photos[0].value;
        }
        user.save(function(err) {
          if (err) console.log(err);
          return done(err, user);
        });
      } else {
        return done(err, user);
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  console.log("Serialize:" + user.provider_id);
  done(null, user.provider_id);
});

passport.deserializeUser(function(id, done) {
  console.log("Deserialize:" + id);
  User.findOne({provider_id: id})
  .then(user => {
    console.log(user);
    return done(null, user);
  });
});

module.exports = passport;
