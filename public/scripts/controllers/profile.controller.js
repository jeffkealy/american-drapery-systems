app.controller('ProfileController', ["$http", "UserFactory", "IdFactory", "$location", "$mdDialog",  function($http, UserFactory, IdFactory, $location, $mdDialog) {
  var self = this;
  self.currentProfile = {};
  self.checkbox = true;
  self.clients = [];
  self.selected = {};
  self.showCompany = false;
  self.showUpdateButton = true;
  self.showSubmitButton = false;

  //Submit button function
  self.submitButton = function(){
    if (self.checkbox == true) {
      self.currentProfile.billing_address_street = self.currentProfile.survey_address_street
      self.currentProfile.billing_address_city = self.currentProfile.survey_address_city
      self.currentProfile.billing_address_state = self.currentProfile.survey_address_state
      self.currentProfile.billing_address_zip = self.currentProfile.survey_address_zip
    }
    console.log("submit button clicked. Object:", self.currentProfile);
    postClients();
  }

  //Update existing client information Button
  self.updateButton = function(){
    if (self.checkbox == true) {
      self.currentProfile.billing_address_street = self.currentProfile.survey_address_street
      self.currentProfile.billing_address_city = self.currentProfile.survey_address_city
      self.currentProfile.billing_address_state = self.currentProfile.survey_address_state
      self.currentProfile.billing_address_zip = self.currentProfile.survey_address_zip
    }
    console.log("self.selected", self.selected);
    updateClient();
  }

  //GET client_name and id for Dropdown
  function getClients() {
    // currentUser = UserFactory.getUser();
    console.log("current user: ", currentUser);
    currentUser.getToken().then(function(idToken) {
      $http({
        method: 'GET',
        url: '/clients',
        headers: {
          id_token: idToken
        }
      }).then(function(response){
        console.log('success. Response', response.data);
        self.clients = response.data
      });
    });
  }

  // getClients();

  //GET client information from client selected from dropdown
  function getClient() {
    // currentUser = UserFactory.getUser();
    console.log("current user: ", currentUser);
    currentUser.getToken().then(function(idToken) {
      $http({
        method: 'GET',
        url: '/clients/' + self.selected.id,
        headers: {
          id_token: idToken
        }
      }).then(function(response){
        console.log('success. Response', response.data);
        self.currentProfile = response.data[0]
        if (self.currentProfile.client_name == self.selected.client_name) {
          self.showCompany = true;
        } else {
          self.showCompany = false;
        }
      });
    });
  }

  //POST client information to database
  function postClients() {
    // currentUser = UserFactory.getUser();
    console.log("current user: ", currentUser);
    currentUser.getToken().then(function(idToken) {
      $http({
        method: 'POST',
        url: '/clients',
        data: self.currentProfile,
        headers: {
          id_token: idToken
        }
      }).then(function(response){
        console.log('success in adding new client');
        var clientId = response.data[0].id;
        console.log(response.data[0].id);
        self.survey = {
          client_id: clientId,
          survey_date: self.currentProfile.surveyDate,
          status: "Pending",
          last_modified: new Date()
        }
        addNewSurvey(self.survey);
      },
      function(err) {
        console.log("error updating clientdetails: ", err);
        if (err.status === 403) {
          notAuthorizedAlert();
          console.log("In error 403");
        }
      });
    });
  }

  //Update client information in database
  function updateClient() {
    // currentUser = UserFactory.getUser();
    console.log("current user: ", currentUser);
    currentUser.getToken().then(function(idToken) {
      $http({
        method: 'POST',
        url: '/clients/' + self.selected.id,
        data: self.currentProfile,
        headers: {
          id_token: idToken
        }
      }).then(function(response){
        console.log('success');
        self.survey = {
          client_id: self.selected.id,
          survey_date: self.currentProfile.surveyDate,
          status: "Pending",
          last_modified: new Date()
        }
        addNewSurvey(self.survey);
      },
      function(err) {
        console.log("error updating clientdetails: ", err);
        if (err.status === 403) {
          notAuthorizedAlert();
          console.log("In error 403");
        }
      });
    });
  }

  //course of action from drop down selection
  self.dropdownOption = function(){
    console.log("selected", self.selected);
    if (self.selected === "None") {
      self.currentProfile = {}
      self.showCompany = false;
      self.showUpdateButton = true;
      self.showSubmitButton = false;
      console.log("This if statement works");
    } else {
      self.showUpdateButton = false;
      self.showSubmitButton = true;
      console.log("SELECTED ID: ", self.selected.id);
      getClient();
    }
  }


  function addNewSurvey(survey) {
    console.log("Running addNewSurvey");
    // currentUser = UserFactory.getUser();
    currentUser.getToken().then(function(idToken) {
      $http({
        method: 'POST',
        url: '/surveys',
        data: self.survey,
        headers: {
          id_token: idToken
        }
      }).then(function(response){
        //setting the survey # in factory to the new survey id
        var newSurveyId = response.data[0].id;
        IdFactory.setSurvey(newSurveyId);
        $location.path('/area/' + newSurveyId);
        console.log('success in adding new survey');
      },
      function(err) {
        console.log("error updating clientdetails: ", err);
        if (err.status === 403) {
          notAuthorizedAlert();
          console.log("In error 403");
        }
      });
    });
  }

  UserFactory.auth.$onAuthStateChanged(function(firebaseUser) {
    currentUser = firebaseUser;
    getClients();
  })

  function notAuthorizedAlert() {
      alert = $mdDialog.alert({
        title: 'Attention',
        textContent: 'You are not authorized to perform this action',
        ok: 'Close'
      });

      $mdDialog
        .show( alert )
        .finally(function() {
          alert = undefined;
        });
    }
}]);
