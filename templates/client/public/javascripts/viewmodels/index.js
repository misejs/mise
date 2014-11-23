var eggs = require('eggs');
var async = require('async');
var routes = require('../routes');

module.exports = function($,callback){
  async.forEach(routes,function(route,done){
    var viewModel = new route.ViewModel(function(){
      eggs($,{selector : route.selector}).bind(viewModel);
      done();
    });
  },function(err){
    if(callback){
      var html = $.html();
      callback(err,html);
    }
  });
}
