var {{name}} = require('../{{name}}');
var extend = require('{{packageName}}');

var ExtendedModel = extend({{name}},{{config}});

module.exports = ExtendedModel;

{{usageWarning}}
