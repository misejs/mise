var Model = require('{{modelPath}}');
var helpers = require('./helpers');

function AdminCreate{{modelName}}ViewModel() {
  var self = this;
  self.model = new Model();
  self.fields = helpers.parseSchema(self.model.schema);
  self.save = function(){
    self.model = helpers.modelFromFields(Model,self.fields);
    self.model.save(function(err,saved){
      if(err) return console.error('error saving :',arguments);
      self.model = saved;
      window.location = '/admin/{{collectionName}}/' + saved[Model.idKey];
    });
  };
};
module.exports = AdminCreate{{modelName}}ViewModel;
