var program = require('commander');
var pkg = require('../package.json');
var path = require('path');
var async = require('async');
var utils = require('./utils');

// ingredients
var ingredients = [
  require('./ingredients/express'),
  require('./ingredients/base')
];

// CLI

var mise = module.exports = function(){
  var p = program
    .version(pkg.version)
    .usage('[ingredient] [options] [dir]');

  var programs = {};

  ingredients.forEach(function(ingredient){
    programs[ingredient.name] = ingredient.run;
    (ingredient.options || []).forEach(function(option){
      var flags = option.flag ? '-' + option.flag + ', ' : '    ';
      flags += option.longFlag ? '--' + option.longFlag : '';
      p.option(flags,option.hint);
    });
  });

  p.parse(process.argv);

  var ingredientName = p.args.shift();
  var ingredientProgram = programs[ingredientName];
  if(!ingredientProgram && !program.regenerateGulp){
    p.outputHelp();
  } else {
    var destinationPath = p.args.shift() || '.';
    var appName = path.basename(path.resolve(destinationPath));
    // run the specified ingredient
    var run = [];
    if(ingredientProgram){
      run.push(ingredientProgram.bind(null,p,pkg,destinationPath,appName));
    }
    // always run the base
    if(ingredientName != 'base'){
      run.push(programs.base.bind(null,p,pkg,destinationPath,appName));
    }
    // go!
    async.series(run,function(err){
      if(err) return utils.abort(err.message);
      console.log('Mise en place successful.');
    });
  }
};
