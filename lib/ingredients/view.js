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
      createView(options.create,callback);
    } else {
      this.printUsage(viewmodel);
    }
  }
}

var createView = function(name,callback,force){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  var viewDir = path.join(miseDir,config.paths.views);
  var viewFile = path.join(viewDir, name+'.html');

  if (!force && fs.existsSync(path.join(viewFile))) {
    return utils.ask('view ' + name + ' already exists. Would you like to overwrite it?',function(err,overwrite){
      if(err) return callback(err);
      if(!overwrite) return callback(new Error('Refusing to overwrite existing view.'));
      createView(name,callback,true);
    });
  }

  console.log('creating view',name);

  async.waterfall([
    utils.mkdir.bind(utils,viewDir),
    utils.copyTemplate.bind(utils,'express/eggs-html/view.html',viewFile),
    utils.updateFile.bind(utils,viewFile,/{{name}}/g,name)
  ],callback);
};
