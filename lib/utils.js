var os = require('os');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var merge = require('deepmerge');
var prompt = require('prompt');

var miseConfig;
var miseDir;

var getMiseDir = function(dir){
  dir = dir || process.cwd();
  if(fs.existsSync(path.join(dir,'.mise'))){
    miseDir = dir;
    return miseDir;
  } else if(dir != '/'){
    return getMiseDir(path.dirname(dir));
  } else {
    return false;
  }
};

var utils = module.exports = {
  eol : os.EOL,
  loadTemplate : function(name){
    return fs.readFileSync(path.join(__dirname, '..', 'templates', name), 'utf-8');
  },
  copyTemplate : function(from,to,cb){
    from = path.join(__dirname, '..', 'templates', from);
    utils.write(to, fs.readFileSync(from, 'utf-8'),cb);
  },
  emptyDirectory : function(path, fn) {
    fs.readdir(path, function(err, files){
      if (err && 'ENOENT' != err.code) throw err;
      fn(!files || !files.length);
    });
  },
  write : function(path, str, mode, callback) {
    if(typeof mode == 'function'){
      callback = mode;
      mode = undefined;
    }
    fs.writeFile(path, str, { mode: mode || 0666 },callback);
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
  updatePackage : function(destDir,newPkg,callback){
    var pkgPath = path.join(destDir,'package.json');
    var pkg = {};
    if(fs.existsSync(path.join(pkgPath))){
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath,'utf-8'));
      } catch(e){
        console.error(e);
        return callback(new Error('Malformed package.json.'));
      }
    }
    pkg = merge(pkg, newPkg);
    utils.write(pkgPath,JSON.stringify(pkg,null,2),callback);
  },
  updateFile : function(path,find,replace,callback){
    fs.readFile(path,'utf-8',function(err,contents){
      if(err) return callback(err);
      var matches = contents.match(find);
      if(!matches){
        callback(new Error('Unable to update file, no matches found.'));
      } else {
        contents = contents.replace(find,replace);
        utils.write(path,contents,callback);
      }
    });
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
          before: function(v) { return v == 'y' ? true : v == 'n' ? false : undefined; }
        }
      }
    },function(err,options){
      callback(err,options.overwrite);
    });
  },
  miseDir : function(){
    return getMiseDir();
  },
  miseConfig : function(){
    var miseDir = getMiseDir();
    if(!miseDir){
      return null;
    } if(!miseConfig){
      var filePath = path.join(miseDir,'.mise/config.json');
      var config = {};
      try {
        config = JSON.parse(fs.readFileSync(filePath,'utf8'));
      } catch (e) {
        console.error('Mise config is not valid JSON.');
        throw e;
        return e;
      }
      return config;
    }
  }
}
