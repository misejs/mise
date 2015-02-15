var utils = require('../../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = {
  name : 'gulp',
  options :[
    {
      name : 'regenerate',
      longFlag : 'regenerate',
      description : 'overwrites the gulpfile with the template version or creates it if none exist.'
    },
    {
      name : 'destinationPath',
      flag : 'p',
      longFlag : 'path',
      description : 'The destination of this app'
    }
  ],
  run : function(options,pkg,destinationPath,appName,done){
    if (typeof destinationPath == 'function') {
      callback = destinationPath;
      destinationPath = options.destinationPath;
    }
    if(!destinationPath) throw new Error('You must specify a destination path when running the gulp generator.');

    console.log('running gulp generator');
    var gulpDir = path.join(destinationPath,'gulp');
    var gulpfile = utils.loadTemplate('gulp/gulpfile.js');
    var gulpPath = path.join(destinationPath,'gulpfile.js');

    async.waterfall([
      utils.mkdir.bind(null,gulpDir),
      function(cb){
        fs.exists(gulpPath,function(exists){
          var done = function(err,overwrite){
            if(err) return cb(err);
            cb(exists && !overwrite ? new Error('Gulpfile already exists') : null);
          }
          if(exists && options.regenerateGulp){
            utils.ask('Looks like there\'s already a gulpfile. Overwrite?',done);
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
      },function(){
        console.log();
        console.log('   start the server with gulp:');
        console.log('     $ gulp serve');
        console.log();
        done();
      });
    });
  }
}
