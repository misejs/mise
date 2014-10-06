var eggs = require('eggs');
var async = require('async');
var routes = require('../routes');

module.exports = function($,callback){
  // TODO: potential scope leak here, need to make sure that if we're running async we don't overwrite other consumers' eggs $ properties...
  eggs.$ = $;
  async.forEach(routes,function(route,done){
    var viewModel = new route.viewModel(function(){
      eggs.bind(viewModel,{
        selector : route.selector
      });
      done();
    });
  },function(err){
    if(callback){
      var html = eggs.$.html();
      callback(err,html);
    }
  });
}
