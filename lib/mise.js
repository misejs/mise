var cuisinart = require('cuisinart');
var pkg = require('../package.json');
var path = require('path');
var rimraf = require('rimraf');

// ingredients
var ingredients = [
  require('./ingredients/site')
];

// CLI

var mise = module.exports = function(){
  var p = cuisinart.program('mise')
    .version(pkg.version)
    .usage('[ingredient] [options] [dir]')
    .description('Generate a mise component in the app specified by [dir].');

  ingredients.forEach(p.command.bind(p.command));

  var args = [];
  // if we pass ingredients as arguments, add them as commands and remove them from the arguments.
  Array.prototype.slice.call(process.argv).forEach(function(arg,idx){
    if(idx < 2 || !/^\./.test(arg)) return args.push(arg);
    try{
      var ingredient = require(arg);
      p.command(ingredient);
      console.log('using ingredient',arg);
    } catch (err){
      args.push(arg);
    }
  });

  var extraArgs = p.unmatchedArgs(args);
  var destinationPath = extraArgs[extraArgs.length-1] || '.';
  var appName = path.basename(path.resolve(destinationPath));

  p.baseArgs(pkg,destinationPath,appName);
  p.parse(args,function(err){
    if(err){
      console.error('error encountered, cleaning up...');
      rimraf(destinationPath,function(){
        throw err;
      });
    } else {
      console.log('Your mise en place is ready!');
    }
  });
};
