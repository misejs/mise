function Home(){
  var self = this;
  // this is an example of something we pass through on the server, but generate on the client.
  self.currentUrl = self.currentUrl || (typeof window !== 'undefined' && window.location.href);
  self.title = "Mise";
  return self;
};

module.exports = Home;
