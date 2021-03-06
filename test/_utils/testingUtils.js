var assert = require('assert');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fork = require('child_process').fork;
var mkdirp = require('mkdirp');
var path = require('path');
var rimraf = require('rimraf');
var log = require('npmlog');
var async = require('async');

if(process.argv.join(' ').match(/\s-?-v(erbose)?/) && log.level != 'verbose'){
  log.level = 'verbose';
}

var utils = module.exports = {
  binPath : path.resolve(__dirname, '../../bin/mise'),
  tempDir : path.resolve(__dirname, '../../temp'),
  cleanup : function(dir, callback) {
    if (typeof dir === 'function') {
      callback = dir;
      dir = utils.tempDir;
    }

    rimraf(dir, function (err) {
      callback(err);
    });
  },
  createEnvironment : function(callback) {
    var num = process.pid + Math.random();
    var dir = path.join(utils.tempDir, ('app-' + num));

    mkdirp(dir, function ondir(err) {
      if (err) return callback(err);
      callback(null, dir);
    });
  },
  npmInstall : function(dir, callback) {
    // npm lazy relies on this existing, so we'll fake it.
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    if(!home) process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] = path.join(__dirname,'temp');
    var npm_lazy = fork('./node_modules/npm_lazy/bin/npm_lazy',['--config',path.join(__dirname,'npm_lazy_config.js')],function(){});
    exec('npm install --registry http://localhost:5656', {cwd: dir},function(){
      npm_lazy.kill('SIGKILL');
      callback();
    });
  },
  parseCreatedFiles : function(output, dir) {
    var files = [];
    var lines = output.split(/[\r\n]+/);
    var match;

    for (var i = 0; i < lines.length; i++) {
      if ((match = /create.*?: (.*)$/.exec(lines[i]))) {
        var file = match[1];

        if (dir) {
          file = path.resolve(dir, file);
          file = path.relative(dir, file);
        }

        file = file.replace(/\\/g, '/');
        files.push(file);
      }
    }

    return files;
  },
  shell : function(dir, cmd, args, stdout, stderr, callback){
    if(typeof args == 'function'){
      callback = stderr;
      stderr = stdout;
      stdout = args;
      args = [];
    }
    var child = spawn(cmd, args, {
      cwd: dir
    });

    child.stdout.on('data', stdout);
    child.stderr.on('data', stderr);

    var done = function(code){
      if(code !== 0){
        callback(new Error('non-zero exit code : ' + code));
      } else {
        callback();
      }
    };

    child.on('error', callback);
    child.on('exit', done);
    child.on('close', done);

    return child;
  },
  run : function(dir, args, callback) {
    log.verbose('')
    var argv = [utils.binPath].concat(args);
    var chunks = [];
    var exec = process.argv[0];
    var stderr = [];

    var child = spawn(exec, argv, {
      cwd: dir
    });

    child.stdout.on('data', function ondata(chunk) {
      chunks.push(chunk);
    });
    child.stderr.on('data', function ondata(chunk) {
      stderr.push(chunk);
    });

    child.on('error', callback);
    child.on('exit', function onexit() {
      var err = null;
      var stdout = Buffer.concat(chunks)
        .toString('utf8')
        .replace(/\x1b\[(\d+)m/g, '_color_$1_');

      try {
        assert.equal(Buffer.concat(stderr).toString('utf8'), '');
      } catch (e) {
        err = e;
      }
      callback(err, stdout);
    });
  },
  nukePort : function(port, stdout, stderr, callback){
    if(!callback && !stderr){
      callback = stdout;
      stdout = function(){};
      stderr = function(){};
    }
    var cmd = path.join(__dirname,'nuke.sh');
    var done = function(code){
      if(code !== 0){
        callback(new Error('non-zero exit code : ' + code));
      } else {
        callback();
      }
    };
    var terminal = require('child_process').spawn('bash');
    terminal.stdout.on('data', stdout);
    terminal.on('exit', done);

    setTimeout(function() {
        terminal.stdin.write(''+cmd+' '+port+'\n');
        terminal.stdin.end();
    }, 1000);
  }
};
