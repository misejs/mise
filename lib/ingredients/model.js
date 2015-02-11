var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');
var pluralize = require('pluralize');

var model = module.exports = {
  name : 'model',
  description : 'create a mise model or regenerate the models files.',
  options :[
    {
      name : 'create',
      flag : 'c',
      longFlag : 'create',
      description : 'create a new model - also can call mise model <modelname> and it will also create a new model.'
    }
  ],
  run : function(options,pkg,callback){
    if(this.unmatchedArgs.length == 1 && /^\w+$/.test(this.unmatchedArgs[0])){
      options.create = this.unmatchedArgs[0];
    }
    if(options.create){
      createModel(options.create,callback);
    } else {
      this.printUsage(model);
    }
  }
}

var capitalize = function(s){
  return s.toLowerCase().replace(/^./,s[0].toUpperCase());
};

var createModel = function(name,callback){
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
