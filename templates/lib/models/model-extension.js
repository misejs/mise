var {{name}} = require('../{{name}}');
var extend = require('{{packageName}}');

var ExtendedModel = extend({{name}},{
  /* add your config here */
});

module.exports = ExtendedModel;

{{usageWarning}}
