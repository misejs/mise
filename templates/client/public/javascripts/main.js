var eggs = require('eggs');
var async = require('async');
var routes = require('./routes');

async.forEach(routes,function(route,done){
  eggs(route.selector,route.viewmodel,done);
},function(err){
  // completed setting up eggs.
});
