var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var modelIngredient = require('./model');
var viewIngredient = require('./view');

var oauth = module.exports = {
  name : 'oauth',
  description : 'Mise oauth server generator.',
  options :[
    {
      name : 'extension',
      flag : 'e',
      longFlag : 'extension',
      description : 'Uses this model extension for interfacing with our data store.'
    },
    {
      name : 'dialogPath',
      longFlag : 'dialog-path',
      description : 'Sets the path to the oAuth dialog to something other than /oauth/authorize'
    }
  ],
  run : function(options,pkg,callback){
    var extension = options.extension;

    if(extension) {
      async.series([
        validateModels.bind(this,extension,pkg),
        validateViews.bind(this,pkg),
        createAuth.bind(this,extension)
      ],callback);
    } else {
      this.printUsage(oauth);
    }
  }
}

var validateModel = function(modelName,extension,callback){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir,extension,modelName+'.js');

  var Model = require(modelFile);
  var schema = Model.prototype.schema;

  var errPre = 'Invalid model: the '+extension+' '+modelName+' model must ';
  var errPost = ' to be used with the oauth generator.';
  if(!Model.idKey) return callback(new Error(errPre + 'expose an idKey class property for serialization' + errPost));

  utils.updateFile(modelFile,'{{idKey}}',Model.idKey,true,function(err){
    if(err) return callback(err);
    if(!Model.one || !Model.prototype.save) return callback(new Error(errPre + 'have a .one class method and a .save instance method' + errPost));
    switch(modelName) {
      case 'User':
        if(!schema.identifier || !schema.password) return callback(new Error(errPre + 'have the keys "identifier" and "password"' + errPost));
        break;
      case 'OAuthClient':
        if(!schema.clientId || !schema.clientSecret) return callback(new Error(errPre + 'have the keys "clientId" and "clientSecret"' + errPost));
        break;
      case 'OAuthCode':
        var failed = !schema.code || !schema.clientId || !schema.redirectURI || !schema.userId;
        if(failed) return callback(new Error(errPre + 'have the keys "code", "clientId", "redirectURI" and "userId"' + errPost));
        break;
      case 'AccessToken':
        if(!schema.token || !schema.userId || !schema.clientId) return callback(new Error(errPre + 'have the keys "token", "userId" and "clientId"' + errPost));
        break;
    }
    callback(null);
  });
}

var createModel = function(modelName,extension,pkg,callback){
  // make sure that our models & extensions exist (and if not, create them.)
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  if(!miseDir || !config) return callback(new Error('Unable to find a local mise app.'));

  var modelDir = path.join(miseDir,config.paths.models);
  var modelFile = path.join(modelDir,modelName + '.js');
  var modelExists = fs.existsSync(modelFile);
  var extensionExists = fs.existsSync(path.join(modelDir,extension,modelName + '.js'));

  if(modelExists && extensionExists) return callback(null);

  var opts = {
    config : {
      // override the config so we can use it right away.
      'mongo' : {
        allowUse : true
      }
    }
  };
  opts.create = modelName;
  if(!modelExists){
    opts.schema = modelName;
  }
  if(!extensionExists) opts['extensions'] = extension;
  return modelIngredient.run.call(this,opts,pkg,function(err){
    if(err) return callback(err);
    validateModel(modelName,extension,callback);
  });
};

var validateModels = function(extension,pkg,callback){
  var self = this;
  // we need a few models that we'll use for oAuth - make them:
  async.forEachSeries([
    'OAuthClient',
    'AccessToken',
    'OAuthCode',
    'User'
  ],function(modelName,done){
    createModel.call(self,modelName,extension,pkg,done);
  },callback);
};

var validateViews = function(pkg,callback){
  var self = this;
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();

  var baseViewDir = path.join(miseDir,config.paths.views);

  var viewDir = path.join(miseDir,config.oauth.views);

  var views = ['oauth/dialog'];

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

var createAuth = function(extension, callback){
  var miseDir = utils.miseDir();
  var config = utils.miseConfig();
  var modelDir = path.join(miseDir,config.paths.models);
  var appFile = path.join(miseDir,config.paths.app);

  var viewPath = path.join(miseDir,config.paths.views);
  var dialogViewPath = path.join(miseDir,config.oauth.views,'dialog');

  var authDir = path.join(miseDir,config.oauth.lib);
  var middlewareFilePath = path.join(authDir,'middleware.js');
  var authFilePath = path.join(authDir,'auth.js');
  var oauthFilePath = path.join(authDir,'oauth2.js');

  var middlewarePath = utils.requireString(path.relative(path.dirname(appFile),middlewareFilePath));
  var middlewareRequireString = "app.use(require('"+middlewarePath+"'));";

  var modelFile = function(modelName){
    return path.join(modelDir,extension,modelName + '.js');
  };
  var modelPath = function(modelName){
    return utils.requireString(path.relative(path.join(miseDir,config.oauth.lib),modelFile(modelName)));
  };

  // set up our variables
  var authPath = './auth';
  var auth2Path = './oauth2';
  var authDialogURL = '/oauth/authorize';
  var dialogView = path.relative(viewPath,dialogViewPath);

  async.series([
    utils.mkdir.bind(utils,authDir),
    utils.copyTemplate.bind(utils,'oauth/auth.js',authFilePath),
    utils.copyTemplate.bind(utils,'oauth/oauth2.js',oauthFilePath),
    utils.copyTemplate.bind(utils,'oauth/middleware.js',middlewareFilePath),
    utils.updateFile.bind(utils,authFilePath,'{{userModelPath}}',modelPath('User')),
    utils.updateFile.bind(utils,authFilePath,'{{oauthClientModelPath}}',modelPath('OAuthClient')),
    utils.updateFile.bind(utils,authFilePath,'{{accessTokenModelPath}}',modelPath('AccessToken')),
    utils.updateFile.bind(utils,oauthFilePath,'{{userModelPath}}',modelPath('User')),
    utils.updateFile.bind(utils,oauthFilePath,'{{authCodeModelPath}}',modelPath('OAuthCode')),
    utils.updateFile.bind(utils,oauthFilePath,'{{oauthClientModelPath}}',modelPath('OAuthClient')),
    utils.updateFile.bind(utils,oauthFilePath,'{{accessTokenModelPath}}',modelPath('AccessToken')),
    utils.updateFile.bind(utils,oauthFilePath,'{{oauthDialogView}}',dialogView),
    utils.updateFile.bind(utils,middlewareFilePath,'{{authPath}}',authPath),
    utils.updateFile.bind(utils,middlewareFilePath,'{{oauth2Path}}',auth2Path),
    utils.updateFile.bind(utils,middlewareFilePath,'{{authDialogURL}}',authDialogURL),
    // TODO: we should find a cleaner way to update the config for these guys, if the user has already configured them they'll get an unnecessary reminder.
    // but if they haven't, they'll have to duplicate the same config for each one, which kind of sucks too.
    utils.appendFile.bind(utils,modelFile('User'),uninitializedModelWarning),
    utils.appendFile.bind(utils,modelFile('OAuthClient'),uninitializedModelWarning),
    utils.appendFile.bind(utils,modelFile('OAuthCode'),uninitializedModelWarning),
    utils.appendFile.bind(utils,modelFile('AccessToken'),uninitializedModelWarning),
    utils.injectFile.bind(utils,appFile,'mise routes',passportSetupString),
    utils.injectFile.bind(utils,appFile,'mise routes',middlewareRequireString),
    utils.updatePackage.bind(utils,miseDir,{
      dependencies : {
        passport : '~0.2.1',
        'passport-http' : '~0.2.2',
        'passport-oauth2-client-password' : '~0.1.2',
        'passport-http-bearer' : '~1.0.1',
        'oauth2orize' : '~1.0.1'
      }
    })
  ],callback);
}
