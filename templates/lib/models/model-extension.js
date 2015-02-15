var {{name}} = require('../{{name}}');
var extend = require('{{packageName}}');

// delete this line after you configure your extension.
throw new Error('Unconfigured model extension. Configure your extension before using it.');

var ExtendedModel = extend({{name}},{
  /* add your config here */
});

module.exports = ExtendedModel;
