var os = require('os');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var merge = require('deepmerge');
var prompt = require('prompt');
var exec = require('child_process').exec;
var Moniker = require('moniker');

var rwg = Moniker.generator([Moniker.adjective, Moniker.verb, Moniker.noun]);

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
  randomName : function(){
    return rwg.choose();
  },
  capitalize : function(s){
    return s.replace(/^./,s[0].toUpperCase());
  },
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
  npmInstall : function(callback){
    var destinationPath = utils.miseDir();
    var cwd = process.cwd();
    console.log('installing dependencies...');
    var child = exec('cd '+destinationPath+' && npm install && cd '+cwd, function (error, stdout, stderr) {
      callback(error);
    });
    // child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
  },
  delete : function(file,fn) {
    fs.unlink(file,fn);
    console.log('   \x1b[31mdelete\x1b[0m : ' + file);
  },
  write : function(path, str, mode, callback, updating) {
    if(typeof mode == 'function'){
      updating = callback;
      callback = mode;
      mode = undefined;
    }
    fs.writeFile(path, str, { mode: mode || 0666 },callback);
    console.log('   \x1b[36m'+(updating ? 'update' : 'create')+'\x1b[0m : ' + path);
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
    var before = JSON.stringify(pkg);
    pkg = merge(pkg, newPkg);
    var after = JSON.stringify(pkg);
    if(before == after){
      callback(null,true);
    } else {
      utils.write(pkgPath,JSON.stringify(pkg,null,2),callback,true);
    }
  },
  updateFile : function(path,find,replace,allowFailure,callback){
    if(typeof allowFailure == 'function'){
      callback = allowFailure;
      allowFailure = false;
    }
    fs.readFile(path,'utf-8',function(err,contents){
      if(err) return callback(err);
      var matches = contents.match(find);
      if(!matches && !allowFailure){
        callback(new Error('Unable to update file '+path+', no matches found.'));
      } else {
        contents = contents.replace(find,replace);
        utils.write(path,contents,callback,true);
      }
    });
  },
  appendFile : function(path,str,callback){
    fs.readFile(path,'utf-8',function(err,contents){
      if(err) return callback(err);
      // don't duplicate updates.
      if(~contents.indexOf(str)) return callback(null,false);
      utils.updateFile(path,/$/,'\n' + str,callback);
    });
  },
  injectFile : function(file,text,str,callback){
    var find = new RegExp('\\/\\*\\s*'+text+'\\s*\\*\\/([\\s\\S]+?)\\/\\*\\s*end '+text+'\\s*\\*\\/');
    fs.readFile(file,'utf-8',function(err,contents){
      if(err) return callback(err);
      var matches = contents.match(find);
      if(!matches || !matches[1]){
        callback(new Error('Unable to inject to file '+path.basename(file)+'. Was expecting to find injectable comment block "/* '+text+' */", but none were found.'));
      } else {
        var newContent = (str + '\n').replace(/(\n\r)+/g,'\n');
        // don't double-inject the same content.
        if(~contents.indexOf(newContent)) return callback(null,false);
        var newBlock = matches[0].replace(matches[1],matches[1] + newContent);
        contents = contents.replace(find,newBlock);
        utils.write(file,contents,callback,true);
      }
    });
  },
  requireString : function(filePath){
    return filePath.replace(/^([^\.])/,'./$1').replace(/\.js$/,'');
  },
  ask : function(description,callback){
    prompt.start();
    prompt.get({
      properties : {
        overwrite : {
          description : description,
          default : 'n',
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
