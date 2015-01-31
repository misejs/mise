var os = require('os');
var utils = require('../../utils');

var load_template = utils.loadTemplate;
var copy_template = utils.copyTemplate;
var emptyDirectory = utils.emptyDirectory;
var write = utils.write;
var mkdir = utils.mkdir;
var abort = utils.abort;

var eol = os.EOL;

module.exports = {
  name : 'express',
  options : [
  // TODO: these are not currently supported, eggs will need to support them for us to use them.
  // We now default to ejs.
    // {
    //   flag : 'j',
    //   longFlag : 'jade',
    //   description : 'adds jade support'
    // },
    // {
    //   flag : 'e',
    //   longFlag : 'ejs',
    //   description : 'adds ejs support'
    // },
    // {
    //   longFlag : 'hbs',
    //   description : 'adds handlebars engine support'
    // },
    // {
    //   flag : 'H',
    //   longFlag : 'hogan',
    //   description : 'add hogan.js engine support'
    // },
    {
      name : 'css',
      flag : 'c',
      longFlag : 'css',
      description : 'add stylesheet <engine> support (less|stylus|compass) (defaults to plain css)',
      validArgs : ['less','stylus','compass']
    },
    {
      name : 'force',
      flag : 'f',
      longFlag : 'force',
      description : 'force on non-empty directory'
    },
    {
      name : 'appName',
      flag : 'n',
      longFlag : 'app-name',
      description : 'The name of this app'
    },
    {
      name : 'destinationPath',
      flag : 'p',
      longFlag : 'path',
      description : 'The destination of this app'
    }
  ],
  run : function(options,pkg,destination_path,app_name,callback){
    if (typeof destination_path == 'function') {
      callback = destination_path;
      app_name = options.app_name;
      destination_path = options.destinationPath;
    } else {
      // if we got here via the site generator, we know the directory can be overwritten.
      options.force = true;
    }
    if(!destination_path) throw new Error('You must specify a destination path when creating a new express app.');
    if(!app_name) throw new Error('You must specify an app name when creating a new express app.');

    // pass this to the callback so cuisinart can detect that this is async
    var done = function(){ callback.apply(null,arguments); };
    emptyDirectory(destination_path, function(empty){
      if (empty || options.force) {
        createApplicationAt(destination_path,options,app_name,done);
      } else {
        utils.ask('destination is not empty, continue? ', function(err,ok){
          if (ok) {
            createApplicationAt(destination_path,options,app_name,done);
          } else {
            done();
          }
        });
      }
    });
  }
};

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 * @param {Object} options
 */

function createApplicationAt(path,options,app_name,callback) {
  console.log('running express generator');
  // Template engine

  options.template = 'html';
  if (options.jade) options.template = 'jade';
  if (options.ejs) options.template = 'ejs';
  if (options.hogan) options.template = 'hjs';
  if (options.hbs) options.template = 'hbs';

  var index = load_template('express/js/routes/index.js');

  var css = load_template('express/css/style.css');
  var less = load_template('express/css/style.less');
  var stylus = load_template('express/css/style.styl');
  var compass = load_template('express/css/style.scss');

  var app = load_template('express/js/app.js');
  var www = load_template('express/js/www');

  console.log();

  mkdir(path, function(){
    mkdir(path + '/public');
    mkdir(path + '/public/javascripts');
    mkdir(path + '/public/images');
    mkdir(path + '/public/stylesheets', function(){
      switch (options.css) {
        case 'less':
          write(path + '/public/stylesheets/style.less', less);
          break;
        case 'stylus':
          write(path + '/public/stylesheets/style.styl', stylus);
          break;
        case 'compass':
          write(path + '/public/stylesheets/style.scss', compass);
          break;
        default:
          write(path + '/public/stylesheets/style.css', css);
      }
    });

    mkdir(path + '/routes', function(){
      write(path + '/routes/index.js', index);
    });

    mkdir(path + '/views', function(){
      switch (options.template) {
        case 'html':
          copy_template('express/eggs-html/index.html', path + '/views/index.html');
          copy_template('express/eggs-html/layout.html', path + '/views/layout.html');
          copy_template('express/eggs-html/error.html', path + '/views/error.html');
          break;
        case 'ejs':
          copy_template('express/ejs/index.ejs', path + '/views/index.ejs');
          copy_template('express/ejs/error.ejs', path + '/views/error.ejs');
          break;
        case 'jade':
          copy_template('express/jade/index.jade', path + '/views/index.jade');
          copy_template('express/jade/layout.jade', path + '/views/layout.jade');
          copy_template('express/jade/error.jade', path + '/views/error.jade');
          break;
        case 'hjs':
          copy_template('express/hogan/index.hjs', path + '/views/index.hjs');
          copy_template('express/hogan/error.hjs', path + '/views/error.hjs');
          break;
        case 'hbs':
          copy_template('express/hbs/index.hbs', path + '/views/index.hbs');
          copy_template('express/hbs/layout.hbs', path + '/views/layout.hbs');
          copy_template('express/hbs/error.hbs', path + '/views/error.hbs');
          break;
      }
    });

    // CSS Engine support
    switch (options.css) {
      case 'less':
        app = app.replace('{css}', eol + 'app.use(require(\'less-middleware\')(path.join(__dirname, \'public\')));');
        break;
      case 'stylus':
        app = app.replace('{css}', eol + 'app.use(require(\'stylus\').middleware(path.join(__dirname, \'public\')));');
        break;
      case 'compass':
        app = app.replace('{css}', eol + 'app.use(require(\'node-compass\')({mode: \'expanded\'}));');
        break;
      default:
        app = app.replace('{css}', '');
    }

    // Template support
    app = app.replace('{views}', options.template);

    // package.json
    var pkg = {
        name: app_name
      , version: '0.0.0'
      , private: true
      , scripts: { start: 'node ./bin/www' }
      , dependencies: {
          'express': '~4.10.2',
          'body-parser': '~1.6.6',
          'cookie-parser': '~1.3.2',
          'morgan': '~1.2.3',
          'serve-favicon': '~2.0.1',
          'debug': '~1.0.4'
      }
    }

    switch (options.template) {
      case 'jade':
        pkg.dependencies['jade'] = '~1.5.0';
        break;
      case 'ejs':
        pkg.dependencies['ejs'] = '~0.8.5';
        break;
      case 'hjs':
        pkg.dependencies['hjs'] = '~0.0.6';
        break;
      case 'hbs':
        pkg.dependencies['hbs'] = '~2.7.0';
        break;
      default:
    }

    // CSS Engine support
    switch (options.css) {
      case 'less':
        pkg.dependencies['less-middleware'] = '1.0.x';
        break;
      case 'compass':
        pkg.dependencies['node-compass'] = '0.2.3';
        break;
      case 'stylus':
        pkg.dependencies['stylus'] = '0.42.3';
        break;
      default:
    }

    utils.updatePackage(path,pkg,function(){
      write(path + '/app.js', app,function(){
        mkdir(path + '/bin', function(){
          www = www.replace('{name}', app_name);
          write(path + '/bin/www', www, 0755,function(){
            console.log();
            console.log('   install dependencies:');
            console.log('     $ cd %s && npm install', path);
            console.log();
            // console.log('   run the app:');
            // console.log('     $ DEBUG=' + app_name + ' ./bin/www');
            // console.log();
            callback();
          });
        });
      });
    });
  });
}
