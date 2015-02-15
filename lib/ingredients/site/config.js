var utils = require('../../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = {
  name : 'config',
  description : 'generates the default config for a mise site',
  options :[
    {
      name : 'destinationPath',
      flag : 'p',
      longFlag : 'path',
      description : 'The destination of this app'
    }
  ],
  run : function(options,pkg,destinationPath,appName,callback){
    if (typeof destinationPath == 'function') {
      callback = destinationPath;
      destinationPath = options.destinationPath;
    }
    if(!destinationPath) throw new Error('You must specify a destination path when running the client generator.');

    console.log('running config generator');
    var miseDir = path.join(destinationPath,'.mise');
    var configFile = utils.loadTemplate('config/config.json');
    var configPath = path.join(destinationPath,'.mise/config.json');

    utils.mkdir(miseDir,function(){
      fs.exists(configPath,function(exists){
        if(!exists){
          utils.write(configPath,configFile);
        }
        callback();
      });
    });
  }
}
