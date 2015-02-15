var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var pluralize = require('pluralize');
var version = require('version');
var findit = require('findit');

var model = module.exports = {
  name : 'model',
  description : 'Mise model generator.',
  options :[
    {
      name : 'create',
      flag : 'c',
      longFlag : 'create',
      description : 'create a new model - also can call mise model <modelname> to create a new model.'
    },
    {
      name : 'extensions',
      flag : 'e',
      longFlag : 'extend',
      description : 'a comma separated list of the types of extensions to create for a model.'
    },
    {
      name : 'delete',
      flag : 'd',
      longFlag : 'delete',
      description : 'delete a model.'
    }
  ],
  run : function(options,pkg,callback){
    if(this.unmatchedArgs.length == 1 && /^\w+$/.test(this.unmatchedArgs[0])){
      options.create = this.unmatchedArgs[0];
    }
    var extensions = options.extensions && options.extensions.length ? options.extensions.split(',') : false;
    var modelName = capitalize(options.create || options.delete);

    var next = function(err){
      if(err) return callback(err);
      if (extensions) {
        createExtensions(modelName,extensions,callback);
      } else {
        callback.apply(this,arguments);
      }
    };
    if(options.delete && modelName) {
      deleteModel(modelName,callback);
    } else if(modelName){
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

var deleteModel = function(name,callback,force){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  var modelDir = path.join(miseDir,config.paths.models);

  utils.ask('are you sure you want to delete the ' + name + ' model (and all extensions)?',function(err,destroy){
    if(!destroy) return callback(new Error('Refusing to delete model.'));
    var finder = findit(modelDir);
    finder.on('file', function (file, stat) {
      var pattern = new RegExp('\\/'+name+'\\.js');
      if(pattern.test(file)){
        utils.delete(file);
      }
    });
    finder.on('end', function(){
      callback(null);
    });
    finder.on('error', function(err){
      callback(err);
    });
  });
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

      var create = function(force){
        if (!force && fs.existsSync(path.join(modelFile))) {
          return utils.ask(name +' extension for model ' + modelName + ' already exists. Would you like to overwrite it?',function(err,overwrite){
            if(err) return done(err);
            if(!overwrite) return done(new Error('Refusing to overwrite existing extension.'));
            create(true);
          });
        }

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
      };

      create();
    });
  },callback);
};

var createModel = function(name,callback,force){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  name = capitalize(name);
  var pluralName = pluralize(name).toLowerCase();

  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir, name+'.js');

  if (!force && fs.existsSync(path.join(modelFile))) {
    return utils.ask('model ' + name + ' already exists. Would you like to overwrite it?',function(err,overwrite){
      if(err) return callback(err);
      if(!overwrite) return callback(new Error('Refusing to overwrite existing model.'));
      createModel(name,callback,true);
    });
  }

  console.log('creating model',name);

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
