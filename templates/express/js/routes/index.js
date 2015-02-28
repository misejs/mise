var express = require('express');
var router = express.Router();

var currentUrl = function(req){
  return req.protocol + '://' + req.get('host') + (req.url || "");
}

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { currentUrl : currentUrl(req) });
});

module.exports = router;
