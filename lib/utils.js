var os = require('os');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var prompt = require('prompt');

var utils = module.exports = {
  eol : os.EOL,
  loadTemplate : function(name){
    return fs.readFileSync(path.join(__dirname, '..', 'templates', name), 'utf-8');
  },
  copyTemplate : function(from,to){
    from = path.join(__dirname, '..', 'templates', from);
    utils.write(to, fs.readFileSync(from, 'utf-8'));
  },
  emptyDirectory : function(path, fn) {
    fs.readdir(path, function(err, files){
      if (err && 'ENOENT' != err.code) throw err;
      fn(!files || !files.length);
    });
  },
  write : function(path, str, mode) {
    fs.writeFile(path, str, { mode: mode || 0666 });
    console.log('   \x1b[36mcreate\x1b[0m : ' + path);
  },
  mkdir : function(path, fn) {
    mkdirp(path, 0755, function(err){
      if (err) throw err;
      console.log('   \033[36mcreate\033[0m : ' + path);
      fn && fn();
    });
  },
  abort : function(str) {
    console.error(str);
    process.exit(1);
  },
  updatePackage : function(destDir,newPkg){
    var pkgPath = path.join(destDir,'package.json');
    var pkg = {};
    if(fs.existsSync(path.join(pkgPath))){
      pkg = JSON.parse(fs.readFileSync(pkgPath,'utf-8'));
    }
    _.extend(pkg,newPkg);
    utils.write(pkgPath,JSON.stringify(pkg,null,2));
  },
  updateFile : function(path,find,replace){
    var contents = fs.readFileSync(path,'utf-8');
    var matches = contents.match(find);
    if(!matches){
      return new Error('Unable to update file, no matches found.');
    } else {
      contents = contents.replace(find,replace);
      utils.write(path,contents);
    }
  },
  ask : function(description,callback){
    prompt.start();
    prompt.get({
      properties : {
        overwrite : {
          description : description,
          pattern : /^(y|n)$/i,
          message : 'please enter y or n',
          required : true,
          before: function(val) { return v == 'y' ? true : v == 'n' ? false : undefined; }
        }
      }
    },callback);
  }
}
