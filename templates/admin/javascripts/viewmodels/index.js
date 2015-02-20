var eggs = require('eggs');
var async = require('async');
var routes = require('../routes');

module.exports = function($,callback){
  async.forEach(routes,function(route,done){
    eggs($,{selector : route.selector},route.viewmodel,done);
  },function(err){
    // content will be pulled from $.html();
    if(callback) callback(err);
  });
};
