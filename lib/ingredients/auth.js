var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var modelIngredient = require('./model');
var viewIngredient = require('./view');

var auth = module.exports = {
  name : 'auth',
  description : 'Mise auth generator.',
  options :[
    {
      name : 'extension',
      flag : 'e',
      longFlag : 'extension',
      description : 'Uses this model extension for interfacing with our data store.'
    }
  ],
  run : function(options,pkg,callback){
    var extension = options.extension;
    var modelName = 'User';

    if(modelName && extension) {
      extension = extension.toLowerCase();
      async.series([
        validateModel.bind(this,modelName,extension,pkg),
        validateViews.bind(this,pkg),
        createAuth.bind(this,modelName,extension)
      ],function(err){
        callback(err);
      });
    } else {
      this.printUsage(auth);
    }
  }
}

var validateModel = function(modelName,extension,pkg,callback){
  // make sure that our models & extensions exist (and if not, create them.)
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir,modelName + '.js');
  var modelExists = fs.existsSync(modelFile);
  var extensionPath = path.join(modelDir,extension,modelName + '.js');
  var extensionExists = fs.existsSync(extensionPath);

  if(modelExists && extensionExists) return callback(null);

  var opts = {
    config : {
      // override the config so we can use it right away.
      'mongo' : {
        allowUse : true
      }
    }
  };
  if(!modelExists){
    opts.create = modelName;
    opts.schema = 'user';
  }
  if(!extensionExists) opts['extensions'] = extension;
  return modelIngredient.run.call(this,opts,pkg,function(err){
    if(err) return callback(err);
    // if our model didn't exist, add the idKey to the schema
    if(!modelExists){
      var Model = require(extensionPath);
      utils.updateFile(modelFile,'{{idKey}}',Model.idKey,true,callback);
    } else {
      callback(null);
    }
  });
};

var validateViews = function(pkg,callback){
  var self = this;
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();

  var baseViewDir = path.join(miseDir,config.paths.views);

  var viewDir = path.join(miseDir,config.auth.views);

  var views = ['auth/signup','auth/login'];

  var createViews = function(){
    // create any missing views
    async.forEachSeries(views,function(view,done){
      viewIngredient.run.call(self,{create : view, template : view},pkg,done);
    },callback);
  }

  if(!fs.existsSync(viewDir)) return createViews();

  fs.readdir(viewDir,function(err,files){
    if(err) return callback(err);
    files.forEach(function(filename){
      var filePath = path.relative(baseViewDir,path.join(viewDir,filename));
      for(var i=views.length-1;i>=0;i--){
        var test = new RegExp('^' + views[i].replace('/','\\/') + '\\.[^\\/]+');
        if(test.test(filePath)) views.splice(i,1);
      }
    });
    createViews();
  });
};

var uninitializedModelWarning = "// delete this line after you configure your extension.\nthrow new Error('Unconfigured model extension. Configure your extension before using it.');\n";

var passportSetupString = "// set up passport\nvar passport = require('passport');\napp.use(passport.initialize());\napp.use(passport.session());";

var createAuth = function(modelName, extension, callback){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir,extension,modelName + '.js');
  var appFile = path.join(miseDir,config.paths.app);

  var User = require(modelFile);
  var schema = User.prototype.schema;

  var errPre = 'Invalid model: the '+extension+' '+modelName+' model must ';
  var errPost = ' to be used with the auth generator.';
  if(!schema.identifier || !schema.password) return callback(new Error(errPre + 'have the keys "identifier" and "password"' + errPost));
  if(!User.idKey) return callback(new Error(errPre + 'expose an idKey class property for serialization' + errPost));
  if(!User.one || !User.prototype.save) return callback(new Error(errPre + 'have a .one class method and a .save instance method' + errPost));

  var viewPath = path.join(miseDir,config.paths.views);
  var signupViewPath = path.join(miseDir,config.auth.views,'signup');
  var loginViewPath = path.join(miseDir,config.auth.views,'login');

  var authDir = path.join(miseDir,config.auth.lib);
  var middlewareFilePath = path.join(authDir,'middleware.js');
  var authFilePath = path.join(authDir,'auth.js');

  var middlewarePath = utils.requireString(path.relative(path.dirname(appFile),middlewareFilePath));
  var middlewareRequireString = "app.use(require('"+middlewarePath+"'));";

  // set up our variables
  var userModelPath = utils.requireString(path.relative(path.join(miseDir,config.auth.lib),modelFile));
  var authenticationPath = './auth';
  var signupView = path.relative(viewPath,signupViewPath);
  var loginView = path.relative(viewPath,loginViewPath);
  var idKey = User.idKey;

  async.series([
    utils.updateFile.bind(utils,path.join(modelDir,modelName + '.js'),'{{idKey}}',idKey,true),
    utils.mkdir.bind(utils,authDir),
    utils.copyTemplate.bind(utils,'auth/auth.js',authFilePath),
    utils.appendFile.bind(utils,modelFile,uninitializedModelWarning),
    utils.updateFile.bind(utils,authFilePath,'{{userModelPath}}',userModelPath),
    utils.copyTemplate.bind(utils,'auth/middleware.js',middlewareFilePath),
    utils.updateFile.bind(utils,middlewareFilePath,'{{userModelPath}}',userModelPath),
    utils.updateFile.bind(utils,middlewareFilePath,'{{authenticationPath}}',authenticationPath),
    utils.updateFile.bind(utils,middlewareFilePath,'{{signupView}}',signupView),
    utils.updateFile.bind(utils,middlewareFilePath,'{{loginView}}',loginView),
    utils.injectFile.bind(utils,appFile,'mise routes',passportSetupString),
    utils.injectFile.bind(utils,appFile,'mise routes',middlewareRequireString),
    utils.updatePackage.bind(utils,miseDir,{
      dependencies : {
        passport : '~0.2.1',
        bcryptjs : '~2.1.0',
        'passport-local' : '~1.0.0'
      }
    }),
    utils.npmInstall
  ],function(err){
    callback(err);
  });
}
