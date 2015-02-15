var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var view = require('./view');
var prompt = require('prompt');

var viewmodel = module.exports = {
  name : 'viewmodel',
  description : 'Mise viewmodel generator.',
  options :[
    {
      name : 'create',
      flag : 'c',
      longFlag : 'create',
      description : 'create a new viewmodel - also can call mise viewmodel <name> to create a new viewmodel.'
    },
    {
      name : 'view',
      flag : 'v',
      longFlag : 'view',
      description : 'create a view for this viewmodel as well.'
    },
    {
      name : 'noRoute',
      longFlag : 'no-route',
      description : 'don\'t create a route for this viewmodel when creating it.'
    }
  ],
  run : function(options,pkg,callback){
    if(this.unmatchedArgs.length == 1 && /^\w+$/.test(this.unmatchedArgs[0])){
      options.create = this.unmatchedArgs[0];
    }

    var self = this;

    var next = function(err){
      if(err) return callback(err);
      if (options.view && options.create) {
        createView.call(self,options.create,pkg,callback);
      } else {
        callback.apply(this,arguments);
      }
    };
    if(options.create){
      createViewmodel(options.create,options.noRoute,next);
    } else {
      this.printUsage(viewmodel);
    }
  }
}

var capitalize = function(s){
  return s.toLowerCase().replace(/^./,s[0].toUpperCase());
};

var routeString = function(name,viewmodelPath){
  var str = "//"+name+"\n";
  str +=    "routes.push({"+"\n";
  str +=    "  selector : '#"+name+"',"+"\n";
  str +=    "  viewmodel : require('./"+viewmodelPath+"')"+"\n";
  str +=    "});\n";
  return str;
};

var createViewmodel = function(name,noRoute,callback,force){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  var viewmodelDir = path.join(miseDir,config.paths.viewmodels);
  var viewmodelFile = path.join(viewmodelDir, name+'.js');
  var routesFile = path.join(miseDir,config.paths.routes);

  var viewmodelRoutesPath = path.relative(path.dirname(routesFile),viewmodelFile).replace(/\.js$/,'');

  if (!force && fs.existsSync(path.join(viewmodelFile))) {
    return utils.ask('viewmodel ' + name + ' already exists. Would you like to overwrite it?',function(err,overwrite){
      if(err) return callback(err);
      if(!overwrite) return callback(new Error('Refusing to overwrite existing viewmodel.'));
      createViewmodel(name,noRoute,callback,true);
    });
  }

  console.log('creating viewmodel',name);

  var createRoute = !noRoute ? utils.appendFile.bind(utils,routesFile,routeString(name,viewmodelRoutesPath)) : function(d){d()};

  async.waterfall([
    utils.mkdir.bind(utils,viewmodelDir),
    utils.copyTemplate.bind(utils,'client/public/javascripts/viewmodels/viewmodel.js',viewmodelFile),
    utils.updateFile.bind(utils,viewmodelFile,/{{name}}/g,capitalize(name)),
    createRoute
  ],callback);
};

var createView = function(viewmodelName,pkg,callback){
  var self = this;
  prompt.start();
  prompt.get({
    properties : {
      'view name' : {
        default : viewmodelName,
        required : true
      }
    }
  },function(err,result){
    if(err || !result) return callback(new Error('You must specify a view name.'));
    var name = result['view name'];
    view.run.call(self,{create : name},pkg,callback);
  });
}
