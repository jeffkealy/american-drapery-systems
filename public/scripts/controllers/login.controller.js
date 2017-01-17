app.controller('LoginController', ['UserFactory', '$location', function(UserFactory, $location, TestFactory) {
  console.log("LoginController is running");

  const self = this;

  self.logIn = function() {

    UserFactory.logIn()
    .then(function() {
      $location.path('/dashboard');
    })
    .catch(function(err) {
      console.log("Could not log in!", err);
      UserFactory.logOut()
    })
  };

}]);
