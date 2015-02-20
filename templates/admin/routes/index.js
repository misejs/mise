var express = require('express');
var router = express.Router();

var async = require('async');
var cheerio = require('cheerio');
var client = require('../../public/admin/javascripts/viewmodels');

var renderAdmin = function(view,options,req,res,next){
  res.render(view,options,function(err,html){
    if(err) return next(err);
    var $ = cheerio.load(html);
    client.call(options,$,function(err){
      if(err) return next(err);
      res.send($.html());
    });
  });
};

router.get('/',function(req,res,next){
  renderAdmin('{{homeView}}',{ layout : '{{layoutView}}' },req,res,next);
});
router.get('/:collection', function(req,res){
  renderAdmin('{{listView}}',{ collection : req.params.collection, layout : '{{layoutView}}' },req,res,next);
});
router.get('/:collection/create', function(req,res){
  renderAdmin('{{createView}}',{ collection : req.params.collection, layout : '{{layoutView}}' },req,res,next);
});
router.get('/:collection/:id', function(req,res){
  renderAdmin('{{updateView}}',{ collection : req.params.collection, id : req.params.id, layout : '{{layoutView}}' },req,res,next);
});

module.exports = router;
