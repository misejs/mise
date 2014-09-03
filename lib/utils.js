var os = require('os');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

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
  }
}