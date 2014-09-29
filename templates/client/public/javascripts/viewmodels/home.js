

function HomeViewModel(ready){
  var self = this;
  self.title = "Loading...";
  setTimeout(function(){
    self.title = 'Mise';
    ready();
  },100);
};

module.exports = HomeViewModel;
