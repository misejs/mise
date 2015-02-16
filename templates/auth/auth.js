var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('{{userModelPath}}');

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy({//this is a strategy but why is it not being run?
  usernameField: 'identifier',
  passwordField: 'password'
}, function(username, password, done) {
    User.one({identifier : username},function(err,user){
      if(err) return done(err);
      if(!user) return done(null, false);
      bcrypt.compare(password,user.password,function(err,passed){
        if(!passed) return done(null,false);
        done(null,user.toObject());
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.identifier);
});

passport.deserializeUser(function(id, done) {
  User.one({identifier : id}, function (err, user) {
    done(err, user);
  });
});
