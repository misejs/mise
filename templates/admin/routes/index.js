var express = require('express');
var router = express.Router();

var routes = require('{{routesPath}}');

router.get('/',function(req,res,next){
  res.render('{{homeView}}');
});
router.get('/:collection', function(req,res,next){
  res.render('{{listView}}-' + req.params.collection, { collection : req.params.collection });
});
router.get('/:collection/create', function(req,res,next){
  res.render('{{createView}}-' + req.params.collection);
});
router.get('/:collection/:id', function(req,res,next){
  res.render('{{updateView}}-' + req.params.collection, { collection : req.params.collection, id : req.params.id });
});

module.exports = router;
