var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');
var pluralize = require('pluralize');
var version = require('version');

var model = module.exports = {
  name : 'model',
  description : 'create a mise model or regenerate the models files.',
  options :[
    {
      name : 'create',
      flag : 'c',
      longFlag : 'create',
      description : 'create a new model - also can call mise model <modelname> and it will also create a new model.'
    },
    {
      name : 'extensions',
      flag : 'e',
      longFlag : 'extend',
      description : 'a comma separated list of the types of extensions to create for a model.'
    }
  ],
  run : function(options,pkg,callback){
    if(this.unmatchedArgs.length == 1 && /^\w+$/.test(this.unmatchedArgs[0])){
      options.create = this.unmatchedArgs[0];
    }
    var extensions = options.extensions && options.extensions.length ? options.extensions.split(',') : false;
    var modelName = capitalize(options.create);

    var next = function(err){
      if(err) return callback(err);
      if (extensions) {
        createExtensions(modelName,extensions,callback);
      } else {
        callback.apply(this,arguments);
      }
    };
    if(modelName){
      createModel(modelName,next);
    } else if(extensions) {
      next();
    } else {
      this.printUsage(model);
    }
  }
}

var capitalize = function(s){
  return s.toLowerCase().replace(/^./,s[0].toUpperCase());
};

var validateExtension = function(extension,callback){
  console.log('checking for existence of ' + extension + '...');
  version.fetch(extension,callback);
};

var createExtensions = function(modelName,extensions,callback){
  extensions = extensions.map(function(e){ return e.trim(); });
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();

  async.forEachSeries(extensions,function(name,done){
    console.log('creating',name,'extension for',modelName);

    var packageName = 'mise-model-'+name;

    validateExtension(packageName,function(err,version){
      if(err) return callback(err);
      console.log('using',packageName,'version',version);

      var modelDir = path.join(miseDir,config.paths.models,name);
      var modelFile = path.join(modelDir, modelName+'.js');

      var deps = {};
      deps[packageName] = version;

      async.waterfall([
        utils.mkdir.bind(utils,modelDir),
        utils.copyTemplate.bind(utils,'lib/models/model-extension.js',modelFile),
        utils.updateFile.bind(utils,modelFile,/{{name}}/g,modelName),
        utils.updateFile.bind(utils,modelFile,/{{packageName}}/g,packageName),
        utils.updatePackage.bind(utils,miseDir,{
          dependencies : deps
        })
        ],done);
    });
  },callback);
};

var createModel = function(name,callback){
  console.log('creating model',name);
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  name = capitalize(name);
  var pluralName = pluralize(name).toLowerCase();

  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir, name+'.js');

  async.waterfall([
    utils.mkdir.bind(utils,modelDir),
    utils.copyTemplate.bind(utils,'lib/models/model.js',modelFile),
    utils.updateFile.bind(utils,modelFile,/{{name}}/g,name),
    utils.updateFile.bind(utils,modelFile,'{{pluralName}}',pluralName),
    utils.updatePackage.bind(utils,miseDir,{
      dependencies : { 'mise-model' : '~0.0.1' }
    })
  ],callback);
};
