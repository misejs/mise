var Model = require({{modelPath}});
var helpers = require('./helpers');

function Admin{{modelName}}ListViewModel(ready) {
  var self = this;
  self.items = [];
  self.createLink = '/admin/{{collectionName}}/create';

  var decorateItems = function(items){
    items = items.map(function(item){
      return {
        item : item,
        remove : function(){
          if(confirm('Are you sure you want to delete this item? This cannot be undone.')){
            item.destroy(function(){
              reload();
            },function(err){
              console.error('error removing item: ',err);
            });
          }
        },
        link : '/admin/{{collectionName}}/' + item[Model.idKey]
      }
    });
    return items;
  };

  var reload = function(cb){
    Model.index(function(items){
      self.items = decorateItems(items);
    },function(err){
      console.error('error listing items: ',err);
    },cb);
  }

  reload(ready);
};

module.exports = Admin{{modelName}}ListViewModel;
