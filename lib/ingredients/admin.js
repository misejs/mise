var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var pluralize = require('pluralize');

var admin = module.exports = {
  name : 'admin',
  description : 'Mise admin generator.',
  options :[
    {
      name : 'model',
      flag : 'm',
      longFlag : 'model',
      description : 'create an admin route for a model. Assumes that you have already run mise model, added a rest & database extension, and run mise api for that model.'
    }
  ],
  run : function(options,pkg,callback){
    var self = this;
    if(options.model){
      async.series([
        validateModel.bind(this,options.model),
        createAdmin.bind(this),
        createModelAdmin.bind(this,options.model)
      ],function(err,results){
        callback(err,[].concat.apply([],results));
      });
    } else {
      utils.ask('generate an empty admin section?',function(err,confirmed){
        if(!confirmed) return self.printUsage(admin);
        createAdmin.call(self);
      });
    }
  }
}

var validateModel = function(model,callback){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  var modelPath = path.join(miseDir,config.paths.models,utils.capitalize(model) + '.js');
  var routePath = path.join(miseDir,config.api.routes,pluralize(model).toLowerCase() + '.js');
  var restPath = path.join(miseDir,config.paths.models,'rest',utils.capitalize(model) + '.js');

  var exists = function(path,model,id,help){
    return function(cb){
      fs.exists(path,function(exists){
        if(!exists) return cb(new Error('Cannot create admin for ' + model + '. Couldn\'t find '+id+' file.\n'+help));
        cb();
      });
    };
  };

  async.series([
    exists(modelPath,model,'Model','run "mise model --create <YourModel> --extension <databaseExtension>" first.'),
    exists(routePath,model,'API resource','run "mise api --model <YourModel> --extension <databaseExtension>" first.'),
    exists(restPath,model,'REST extension','run "mise api --model <YourModel> --extension rest" first.')
  ],callback);
};

var createAdmin = function(callback){
  // TODO: don't create if an admin section already exists.

  var miseDir = utils.miseDir();
  var config = utils.miseConfig();

  var adminViewPath = path.join(miseDir,config.admin.views);
  var appFile = path.join(miseDir,config.paths.app);
  var routesFile = path.join(miseDir,config.admin.routes,'index.js');
  var clientRoutesFile = path.join(miseDir,config.admin.clientRoutes);
  var mainFile = path.join(path.dirname(clientRoutesFile),'main.js');
  var viewmodelsPath = path.join(miseDir,config.admin.viewmodels);
  var helpersFile = path.join(viewmodelsPath,'helpers.js');
  var viewmodelsIndex = path.join(viewmodelsPath,'index.js');

  var views = [
    'admin/views/create.html',
    'admin/views/home.html',
    'admin/views/layout.html',
    'admin/views/list.html',
    'admin/views/update.html',
    'admin/views/partials/item.html',
    'admin/views/partials/nav.html'
  ];

  var copyViews = function(callback){
    async.forEachSeries(views,function(view,done){
      var toPath = path.relative('admin/views',view);
      utils.copyTemplate(view,path.join(adminViewPath,toPath),done);
    },callback);
  };

  var adminRoutesPath = utils.requireString(path.relative(path.dirname(appFile),routesFile));
  // TODO: make this route restricted.
  var adminRoutesRequireString = "app.use('"+config.admin.baseURL+"',require('"+adminRoutesPath+"'));";

  var gulpFile = path.join(miseDir,config.paths.gulp,'build-admin.js');

  var viewsDir = path.join(miseDir,config.paths.views);
  var viewPath = function(name){
    return path.relative(viewsDir,path.join(adminViewPath,name));
  };
  var viewmodelsRequireString = utils.requireString(path.relative(path.dirname(routesFile),path.join(miseDir,config.admin.viewmodels)));

  async.series([
    utils.mkdir.bind(utils,path.join(miseDir,config.admin.views)),
    utils.mkdir.bind(utils,path.join(miseDir,config.admin.views,'partials')),
    utils.mkdir.bind(utils,path.join(miseDir,config.admin.viewmodels)),
    utils.mkdir.bind(utils,path.join(miseDir,config.admin.routes)),
    copyViews,
    utils.copyTemplate.bind(utils,'admin/routes/index.js',routesFile),
    utils.updateFile.bind(utils,routesFile,"{{viewmodelsPath}}",viewmodelsRequireString),
    utils.updateFile.bind(utils,routesFile,"{{homeView}}",viewPath('home')),
    utils.updateFile.bind(utils,routesFile,"{{listView}}",viewPath('list')),
    utils.updateFile.bind(utils,routesFile,"{{createView}}",viewPath('create')),
    utils.updateFile.bind(utils,routesFile,"{{updateView}}",viewPath('update')),
    utils.updateFile.bind(utils,routesFile,/{{layoutView}}/g,viewPath('layout')),
    utils.copyTemplate.bind(utils,'admin/gulp/build-admin.js',gulpFile),
    utils.copyTemplate.bind(utils,'admin/javascripts/routes.js',clientRoutesFile),
    utils.copyTemplate.bind(utils,'admin/javascripts/main.js',mainFile),
    utils.copyTemplate.bind(utils,'admin/javascripts/viewmodels/index.js',viewmodelsIndex),
    utils.copyTemplate.bind(utils,'admin/javascripts/viewmodels/helpers.js',helpersFile),
    utils.injectFile.bind(utils,appFile,'mise routes',adminRoutesRequireString)
  ],callback);
};

var routeString = function(collection,action,viewmodelPath){
  var str = "//"+action + ' ' + collection+"\n";
  str +=    "routes.push({"+"\n";
  str +=    "  selector : '#admin-"+action + '-' + collection+"',"+"\n";
  str +=    "  viewmodel : require('"+viewmodelPath+"')"+"\n";
  str +=    "});\n";
  return str;
};

var createModelAdmin = function(model,callback,force){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();

  var modelName = utils.capitalize(model);

  var modelDir = path.join(miseDir,config.paths.models,'rest');
  var modelFile = path.join(modelDir, modelName+'.js');
  var viewmodelsPath = path.join(miseDir,config.admin.viewmodels);
  var routesFile = path.join(miseDir,config.admin.clientRoutes);

  var Model = require(modelFile);
  var collection = Model.prototype.collection;

  var modelPath = function(action){
    return utils.requireString(path.relative(viewmodelsPath,path.join(modelDir,action)));
  };

  var viewmodelPath = function(action,model){
    return path.join(viewmodelsPath,model + '-' + action + '.js');
  };

  var viewmodelRoutesPath = function(action,model){
    return utils.requireString(path.relative(path.dirname(routesFile),viewmodelPath(action,model)));
  };

  var generateViewmodel = function(action){
    var vmPath = viewmodelPath(action,modelName);
    return [
      utils.copyTemplate.bind(utils,'admin/javascripts/viewmodels/'+action+'.js',vmPath),
      utils.updateFile.bind(utils,vmPath,"{{modelPath}}",modelPath(modelName)),
      utils.updateFile.bind(utils,vmPath,"{{collectionName}}",collection,true),
      utils.updateFile.bind(utils,vmPath,/{{modelName}}/g,modelName),
      utils.appendFile.bind(utils,routesFile,routeString(collection,action,viewmodelRoutesPath(action,modelName)))
    ]
  };

  var vmFunctions = ['create','list','update'].reduce(function(arr,action){
    arr = arr.concat(generateViewmodel(action));
    return arr;
  },[]);

  async.series(vmFunctions.concat([
    utils.npmInstall.bind(),
    utils.runGulp.bind(utils,'build-admin')
  ]),callback);

  // TODO: create a viewmodel for this model.
  // TODO: add link to the admin nav.
  // TODO: add a route for this viewmodel to our client routes (using #admin-<action>-<model> as the id)
  // TODO: regenerate the admin dist folder?

  // variables:
  // modelName
  // modelPath
  // collectionName
};
