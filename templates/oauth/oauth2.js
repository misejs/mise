var oauth2orize = require('oauth2orize');
var passport = require('passport');
var OAuthClient = require('{{oauthClientModelPath}}');
var OAuthCode = require('{{authCodeModelPath}}');
var User = require('{{userModelPath}}');
var AccessToken = require('{{accessTokenModelPath}}');

// function to verify if our user is logged in.
var ensureLoggedIn = function() {
  return function(req, res, next) {
    if (!req.user) {
      return res.redirect('/login');
    }
    next();
  }
}

// UID Generation
var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var uid = function(len) {
  // we pre-pad the uid with 0, so in the case of needing to version the access tokens, we can check if each access token is version 0.
  // One example of when this may be necessary, is if your site experiences a large amount of invalid or brute-force requests, you don't want to go to your database. So you could encrypt the value and expiration, then check expiration without hitting your DB.
  var buf = [0];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len-1; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }
  return buf.join('');
};

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  OAuthClient.one(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = new OAuthCode({
    code : uid(16),
    clientId : client[OAuthClient.idKey],
    redirectURI : redirectURI,
    userId : user[User.idKey]
  });
  code.save(function(err,saved) {
    if (err) return done(err);
    done(null, saved);
  });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  OAuthCodes.one({code : code},function(err,authCode){
    if (err) return done(err);
    if (!authCode) return done(null, false);
    if (client[OAuthClient.idKey] !== authCode.clientId) return done(null, false);
    if (redirectURI !== authCode.redirectURI) return done(null, false);

    authCode.destroy(function(err){
      if(err) return done(err);
      var token = new AccessToken({
        token : uid(256),
        userId : authCode.userId,
        clientId : authCode.clientId
      });
      token.save(function(err,saved){
        if(err) return done(err);
        done(null, saved);
      });
    });
  });
}));

// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.

exports.authorization = [
  ensureLoggedIn(),
  server.authorization(function(clientId, redirectURI, done) {
    OAuthClient.one({clientId : clientId}, function(err, client){
      if(err) return done(err);
      // This is where you would validate the redirectURI. Some servers do, some don't.
      // if you plan on making this API public, it is recommended that you add redirectURI validation.
      return done(null,client,redirectURI);
    });
  }),
  function(req, res){
    res.render('{{oauthDialogView}}', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
]

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

exports.decision = [
  ensureLoggedIn(),
  server.decision()
]


// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]
