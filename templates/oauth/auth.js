var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var OAuthClient = require('{{oauthClientModelPath}}');
var AccessToken = require('{{accessTokenModelPath}}');
var User = require('{{userModelPath}}');

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
  function(username, password, done) {
    OAuthClient.one({clientId : username}, function(err,client){
      if(err) return done(err);
      if(!user) return done(null, false);
      if(client.clientSecret != password) return done(null, false);
      return done(null,user);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    OAuthClient.one({clientId : clientId}, function(err,client){
      if(err) return done(err);
      if(!user) return done(null, false);
      if(client.clientSecret != clientSecret) return done(null, false);
      return done(null,user);
    });
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function(accessToken, done) {
    AccessToken.one({token : accessToken}, function(err, token) {
      if (err) return done(err);
      if (!token) return done(null, false);
      User.one(token.userId, function(err, user){
        // TODO: implement scopes for admin vs normal user access?
        var info = { scope: '*' }
        done(null, user, info);
      });
    });
  }
));
