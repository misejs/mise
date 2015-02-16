var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

var view = module.exports = {
  name : 'view',
  description : 'Mise view generator.',
  options :[
    {
      name : 'create',
      flag : 'c',
      longFlag : 'create',
      description : 'create a new view - also can call mise view <name> to create a new view.'
    }
  ],
  run : function(options,pkg,callback){
    if(this.unmatchedArgs.length == 1 && /^\w+$/.test(this.unmatchedArgs[0])){
      options.create = this.unmatchedArgs[0];
    }
    if(options.create){
      createView(options.create,options.template,callback);
    } else {
      this.printUsage(view);
    }
  }
}

var createView = function(name,template,callback,force){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  var viewDir = path.join(miseDir,config.paths.views);
  var viewFile = path.join(viewDir, name+'.html');
  var templateView = path.join('express/eggs-html/',(template || 'view') + '.html');

  if (!force && fs.existsSync(path.join(viewFile))) {
    utils.ask('view ' + name + ' already exists. Would you like to overwrite it?',function(err,overwrite){
      if(err) return callback(err);
      if(!overwrite) return callback(new Error('Refusing to overwrite existing view.'));
      createView(name,template,callback,true);
    });
    return;
  }

  console.log('creating view',name);

  async.series([
    utils.mkdir.bind(utils,path.dirname(viewFile)),
    utils.copyTemplate.bind(utils,templateView,viewFile),
    utils.updateFile.bind(utils,viewFile,/{{name}}/g,name,true)
  ],callback);
};
