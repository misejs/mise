var Model = require('{{modelPath}}');
var helpers = require('./helpers');

function AdminUpdate{{modelName}}ViewModel(ready) {
  var self = this;
  self.model = new Model();
  self.fields = helpers.parseSchema(self.model.schema);

  Model.one(helpers.currentId(self.currentUrl),function(err,info){
    if(err) return console.error(err);
    self.model = info;
    self.fields.forEach(function(field){
      field.value = self.model[field.name];
    });
    ready();
  });
  self.save = function(){
    self.model = helpers.modelFromFields(Model,self.fields);
    self.model.save(function(err,saved){
      if(err) return console.error(arguments);
      self.model = saved;
    });
  };
};

module.exports = AdminUpdate{{modelName}}ViewModel;
