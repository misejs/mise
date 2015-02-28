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
    },
    {
      name : 'skipInstall',
      longFlag : 'skip-install',
      description : 'setting this flag skips the npm install step'
    }
  ],
  run : function(options,pkg,callback){
    if(this.unmatchedArgs.length == 1 && /^\w+$/.test(this.unmatchedArgs[0])){
      options.create = this.unmatchedArgs[0];
    }
    if(!options.extensions && !options.create && !options.delete){
      return this.printUsage(model);
    }

    var extensions = options.extensions && options.extensions.length ? options.extensions.split(',') : false;
    var modelName = utils.capitalize(options.create || options.delete);
    var schemaFile = options.schema || 'default';
    var config = options.config || {};

    var done = function(err){
      if(err) return callback(err);
      if(!options.skipInstall){
        utils.npmInstall(function(){
          callback.apply(arguments);
        });
      } else {
        callback.apply(arguments);
      }
    };

    var next = function(err){
      if(err) return done(err);
      if (extensions) {
        createExtensions(modelName,extensions,config,done);
      } else {
        done.apply(arguments);
      }
    };
    if(options.delete && modelName) {
      deleteModel(modelName,callback);
    } else if(modelName){
      var force = extensions ? false : null;
      createModel(modelName,schemaFile,next,force);
    } else if(extensions) {
      next();
    }
  }
}

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

var defaultUsageWarning = "// delete this line after you configure your extension.\nthrow new Error('Unconfigured model extension. Configure your extension before using it.');\n"

var createExtensions = function(modelName,extensions,params,callback){
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

        var usageWarning = defaultUsageWarning;
        if(params[name] && params[name].allowUse){
          usageWarning = "";
        }

        var deps = {};
        deps[packageName] = "~"+version;

        async.series([
          utils.mkdir.bind(utils,modelDir),
          utils.copyTemplate.bind(utils,'lib/models/model-extension.js',modelFile),
          utils.updateFile.bind(utils,modelFile,/{{name}}/g,modelName),
          utils.updateFile.bind(utils,modelFile,/{{packageName}}/g,packageName),
          utils.updateFile.bind(utils,modelFile,"{{usageWarning}}",usageWarning),
          utils.updatePackage.bind(utils,miseDir,{
            dependencies : deps
          }),
          utils.npmInstall
        ],done);
      };

      create();
    });
  },function(err){
    console.log('created extension' + (extensions.length > 1 ? 's' : '') + ': ' + extensions.join(' ') +'.');
    if(Object.keys(params).some(function(n){ return !params[n].allowUse })){
      if(extensions.length > 1){
        console.log('before you can use these, you\'ll need to configure each extension by editing them.');
      } else {
        console.log('before you can use this extension, you\'ll need to configure it.');
      }
    }
    callback(err);
  });
};

var createModel = function(name,schemaFile,callback,force){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  var schema = utils.loadTemplate(path.join('lib/models/schemas/'+schemaFile+'.js'));
  if(!schema) return callback(new Error('Error loading schema file '+schemaFile));

  name = utils.capitalize(name);
  var pluralName = pluralize(name).toLowerCase();

  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir, name+'.js');

  if (!force && fs.existsSync(path.join(modelFile))) {
    // skip this step if the model exists and we don't care
    if(force === false) return callback();
    return utils.ask('model ' + name + ' already exists. Would you like to overwrite it?',function(err,overwrite){
      if(err) return callback(err);
      if(!overwrite) return callback(new Error('Refusing to overwrite existing model.'));
      createModel(name,schemaFile,callback,true);
    });
  }

  console.log('creating model',name);

  async.series([
    utils.mkdir.bind(utils,modelDir),
    utils.copyTemplate.bind(utils,'lib/models/model.js',modelFile),
    utils.updateFile.bind(utils,modelFile,/{{name}}/g,name),
    utils.updateFile.bind(utils,modelFile,'{{pluralName}}',pluralName),
    utils.updateFile.bind(utils,modelFile,'{{schema}}',schema),
    utils.updatePackage.bind(utils,miseDir,{
      dependencies : { 'mise-model' : '~0.0.4' }
    }),
    utils.npmInstall
  ],callback);
};
