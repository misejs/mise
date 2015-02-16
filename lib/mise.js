var cuisinart = require('cuisinart');
var pkg = require('../package.json');
var path = require('path');
var rimraf = require('rimraf');

// ingredients
var ingredients = [
  require('./ingredients/site'),
  require('./ingredients/model'),
  require('./ingredients/viewmodel'),
  require('./ingredients/view'),
  require('./ingredients/api'),
  require('./ingredients/auth')
];

// CLI

var mise = module.exports = function(){
  var p = cuisinart.program('mise')
    .version(pkg.version)
    .usage('[ingredient] [options]')
    .description('Generate a mise component.');

  ingredients.forEach(p.command.bind(p.command));

  var args = [];
  var currentCommands = [];
  // if we pass ingredients as arguments, add them as commands and remove them from the arguments.
  Array.prototype.slice.call(process.argv).forEach(function(arg,idx){
    if(idx < 2 || !/^\./.test(arg)) return args.push(arg);
    try{
      var ingredient = require(arg);
      p.command(ingredient);
      currentCommands.push(arg);
      console.log('using ingredient',arg);
    } catch (err){
      args.push(arg);
    }
  });

  p.baseArgs(pkg);
  p.parse(args,function(err,created){
    var createdFiles = false;
    if(err){
      console.error('error:',err.message);
      (created || []).forEach(function(cmdCreated){
        (cmdCreated || []).forEach(function(path){
          createdFiles = true;
          console.log('cleaning up ' +path+ '...');
          rimraf(path,function(){
            throw err;
          });
        });
      });
    }
    if(created && !err) {
      console.log('Your mise en place is ready!');
    }
  });
};
