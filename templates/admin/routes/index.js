var express = require('express');
var router = express.Router();

router.get('/',function(req,res,next){
  res.render('{{homeView}}');
});
router.get('/:collection', function(req,res){
  res.render('{{allView}}',{ collection : req.params.collection, layout : '{{layoutView}}' });
});
router.get('/:collection/create', function(req,res){
  res.render('{{createView}}',{ collection : req.params.collection, layout : '{{layoutView}}' });
});
router.get('/:collection/:id', function(req,res){
  res.render('{{updateView}}',{ collection : req.params.collection, id : req.params.id, layout : '{{layoutView}}' });
});

module.exports = router;
