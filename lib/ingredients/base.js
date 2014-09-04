var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = {
  name : 'base',
  options :[
    {
      longFlag : 'regenerate-gulp',
      hint : 'overwrites the gulpfile with the template version or creates it if none exist.'
    }
  ],
  run : function(program,pkg,destinationPath,appName,done){
    var gulpDir = path.join(destinationPath,'gulp');
    var gulpfile = utils.loadTemplate('base/gulpfile.js');
    var gulpPath = path.join(destinationPath,'gulpfile.js');

    process.on('exit', function(){
      console.log();
      console.log('   start the server with gulp:');
      console.log('     $ gulp serve');
      console.log();
    });

    async.waterfall([
      utils.mkdir.bind(null,gulpDir),
      function(cb){
        fs.exists(gulpPath,function(exists){
          var done = function(overwrite){
            cb(exists && !overwrite ? new Error('Gulpfile already exists') : null);
          }
          if(exists && program.regenerateGulp){
            program.confirm('Looks like there\'s already a gulpfile. Overwrite?', done);
          } else {
            done(false);
          }
        });
      },
      function(cb){
        utils.write(gulpPath,gulpfile);
        cb();
      }
    ],function(err){
      // silently ignore errors, as mkdir doesn't fail and we don't mind gulpfile already existing (don't overwrite)
      utils.updatePackage(destinationPath,{
        scripts: {
          start: "gulp serve"
        },
        devDependencies : {
          'gulp' : '~3.8.7',
          'glob' : '~4.0.5'
        }
      });
      done();
    });
  }
}
