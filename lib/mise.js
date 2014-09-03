var program = require('commander');
var pkg = require('../package.json');
var path = require('path');

// ingredients
var ingredients = [
  require('./ingredients/express')
];

// CLI

var mise = module.exports = function(){
  var p = program
    .version(pkg.version)
    .usage('[ingredient] [options] [dir]');

  var programs = {};

  ingredients.forEach(function(ingredient){
    programs[ingredient.name] = ingredient.run;
    ingredient.options.forEach(function(option){
      var flags = option.flag ? '-' + option.flag + ', ' : '    ';
      flags += option.longFlag ? '--' + option.longFlag : '';
      p.option(flags,option.hint);
    });
  });

  p.parse(process.argv);

  var ingredientName = p.args.shift();
  var ingredientProgram = programs[ingredientName];
  if(!ingredientProgram){
    p.outputHelp();
  } else {
    var destinationPath = p.args.shift() || '.';
    var appName = path.basename(path.resolve(destinationPath));
    ingredientProgram(p,pkg,destinationPath,appName);
  }
};
