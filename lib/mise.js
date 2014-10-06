var cuisinart = require('cuisinart');
var pkg = require('../package.json');
var path = require('path');
var rimraf = require('rimraf');

// ingredients
var ingredients = [
  require('./ingredients/express'),
  require('./ingredients/gulp'),
  require('./ingredients/client')
];

// CLI

var mise = module.exports = function(){
  var p = cuisinart.program('mise')
    .version(pkg.version)
    .usage('[ingredient] [options] [dir]')
    .description('Generate a mise component in the app specified by [dir].');

  ingredients.forEach(p.command.bind(p.command));

  var extraArgs = p.unmatchedArgs(process.argv);
  var destinationPath = extraArgs[extraArgs.length-1] || '.';
  var appName = path.basename(path.resolve(destinationPath));

  p.baseArgs(pkg,destinationPath,appName);
  p.parse(process.argv,function(err){
    if(err){
      // TODO: remove app dir
      throw err;
    } else {
      console.log('Your mise en place is ready!');
    }
  });
};
