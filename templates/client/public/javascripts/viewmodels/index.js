var eggs = require('eggs');
var async = require('async');
var routes = require('../routes');

module.exports = function($,callback){
  async.forEach(routes,function(route,done){
    var viewModel;
    var bind = function(){
      eggs($,{selector : route.selector}).bind(viewModel);
      done();
    }
    var viewModel = new route.viewModel(bind);
    if(!route.viewModel.length){
      bind();
    }
  },function(err){
    if(callback){
      var html = $.html();
      callback(err,html);
    }
  });
}
