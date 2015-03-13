var passport = require('passport');
var express = require('express');
var bcrypt = require('bcryptjs');
var router = express.Router();
var User = require('{{userModelPath}}');

require('{{authenticationPath}}');

router.get('/signup', function(req,res,next){
  res.render('{{signupView}}');
});

router.post('/signup', function(req,res,next){
  // this is where you would add any user validation you want when a user signs up.
  // it's likely that you'll want at *least* password and unique identifier (username, email, etc) validation.
  // after you add that, remove this line:
  return res.status(500).send('Please verify your user validation before allowing user signups.');
  var info = req.body;
  bcrypt.hash(info.password, 10, function(err, hash) {
    info.password = hash;
    var user = new User(info);
    user.save(function(err,saved){
      if(err) return next(err);
      if(req.xhr) return res.json(saved.toObject());
      // this is where you would modify the path that the user is redirected to after successfully signing up.
      res.redirect('/');
    });
  });
});

router.get('/login', function(req,res,next){
  res.render('{{loginView}}');
});
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login'
}),function(req, res) {
  if(req.xhr) return res.json(req.user);
  // this is where you would modify the path that the user is redirected to after a successful login.
  // you'll probably want them to be able to pick up where they left off.
  res.redirect('/');
});
router.get('/logout',function(req,res){
  req.logout();
  if(req.xhr) res.sendStatus(204);
  // this is where you would modify the path that the user is redirected to after they log out.
  res.redirect('/');
});

module.exports = router;
