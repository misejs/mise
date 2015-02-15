var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

var api = module.exports = {
  name : 'api',
  description : 'usage: mise api <modelname> <extension>, where the modelname is the model to create REST resources for, and the extension is the model extension that the API should use to save data.',
  run : function(options,pkg,callback){
    if(this.unmatchedArgs.length == 2){
      var modelName = this.unmatchedArgs[0];
      var extension = this.unmatchedArgs[1];
      createAPIEndpoint(modelName, extension, callback);
    } else {
      this.printUsage(api);
    }
  }
}

var createResourceFile = function(modelName,resourceFile,collection,modelPath,callback){
  async.series([
    utils.copyTemplate.bind(utils,'api/resource.js',resourceFile),
    utils.updateFile.bind(utils,resourceFile,/{{name}}/g,collection),
    utils.updateFile.bind(utils,resourceFile,/{{modelName}}/g,modelName),
    utils.updateFile.bind(utils,resourceFile,/{{modelPath}}/g,modelPath)
  ],callback);
};

var createRoutesFile = function(routesFilePath,callback){
  if(fs.existsSync(routesFilePath)) return callback(null,false);
  utils.copyTemplate('api/routes/index.js',routesFilePath,callback);
};

var resourceRoutesString = function(resourcePath,collection,modelName){
  var str = "";
  str += "// "+collection+" resources\n";
  str += "var " + collection + " = require('"+resourcePath+"');\n";
  str += "router.get('/"+collection+"',"+collection+".index);\n";
  str += "router.get('/"+collection+"/:id',"+collection+".show);\n";
  str += "router.post('/"+collection+"',"+collection+".create);\n";
  str += "router.put('/"+collection+"/:id',"+collection+".update);\n";
  str += "router.delete('/"+collection+"/:id',"+collection+".destroy);\n";
  return str;
};

var addResourceRoutes = function(routesFile,resourcePath,collection,modelName,callback){
  var str = resourceRoutesString(resourcePath,collection,modelName);
  utils.injectFile(routesFile,'mise api routes',str,callback);
};

var createAPIEndpoint = function(model,extension,callback){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  model = utils.capitalize(model);
  extension = extension.toLowerCase();
  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir,extension,model + '.js');

  if(!fs.existsSync(modelFile)) return callback(new Error('Model extension of type "'+extension+'" for ' + model + ' does not exist.'));

  var Model = require(modelFile);
  var collection = Model.prototype.collection;

  // TODO: validate that this model handles the methods called by the template resource. If not, bail.

  var routesDir = path.join(miseDir,config.api.routes);
  var routesFilePath = path.join(routesDir,'index.js');
  var appFile = path.join(miseDir,config.paths.app);
  var modelPath = utils.requireString(path.relative(routesDir,modelFile));

  var resourceFile = path.join(routesDir,collection + '.js');
  var resourcePath = utils.requireString(path.relative(routesDir,resourceFile));

  var apiRoutesPath = utils.requireString(path.relative(path.dirname(appFile),routesFilePath));
  var apiRoutesRequireString = "app.use('"+config.api.baseURL+"',require('"+apiRoutesPath+"'));";

  async.series([
    utils.mkdir.bind(utils,routesDir),
    createRoutesFile.bind(this,routesFilePath),
    addResourceRoutes.bind(this,routesFilePath,resourcePath,collection,model),
    createResourceFile.bind(this,model,resourceFile,collection,modelPath),
    utils.injectFile.bind(this,appFile,'mise routes',apiRoutesRequireString)
  ],function(err){
    callback(err);
  });
};
