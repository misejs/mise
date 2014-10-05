var cuisinart = require('cuisinart');
var pkg = require('../package.json');
var path = require('path');

// ingredients
var ingredients = [
  require('./ingredients/express'),
  require('./ingredients/base'),
  require('./ingredients/client')
];

// CLI

var mise = module.exports = function(){

  var destinationPath = process.argv.pop() || '.';
  var appName = path.basename(path.resolve(destinationPath));

  var p = cuisinart.program('mise')
    .version(pkg.version)
    .usage('[ingredient] [options] [dir]')
    .description('Generate a mise component in the app specified by [dir].')
    .baseArgs(pkg,destinationPath,appName);

  ingredients.forEach(p.command.bind(p.command));

  p.parse(process.argv);
};
