var express = require('express');
var router = express.Router();

var currentUrl = function(req){
  return req.protocol + '://' + req.get('host') + (req.url || "");
};

var routes = require('{{routesPath}}');

router.get('/',function(req,res,next){
  res.render('{{homeView}}', { currentUrl : currentUrl(req) });
});
router.get('/:collection', function(req,res,next){
  res.render('{{listView}}-' + req.params.collection, { currentUrl : currentUrl(req), collection : req.params.collection });
});
router.get('/:collection/create', function(req,res,next){
  res.render('{{createView}}-' + req.params.collection, { currentUrl : currentUrl(req) });
});
router.get('/:collection/:id', function(req,res,next){
  res.render('{{updateView}}-' + req.params.collection, { currentUrl : currentUrl(req), collection : req.params.collection });
});

module.exports = router;
