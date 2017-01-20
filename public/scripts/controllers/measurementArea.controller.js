app.controller('MeasurementAreaController', ["$http", 'IdFactory', '$location', 'UserFactory', 'InfoFactory', '$route', '$mdDialog',
function($http, IdFactory, $location, UserFactory, InfoFactory, $route, $mdDialog) {
  var self = this;
  // var survey_id = IdFactory.getSurveyId();
  var surveyId = $route.current.params.surveyId;
  self.loading = false;
  self.showInput = false
  self.companyInfo = {};
  var currentUser;
  var areaId;
  var selectedAreaName;
  var surveyHasAreas = true;
  self.newAreaName = '';
  self.editAreas = false;
  console.log(surveyId);
  self.inputAreaName = false;
  self.toRemove = [];
  self.loggedOut = false;
  // getSurveyDetails();

  //function to send area to measurent controller
  self.setArea = function(index) {
    console.log("index: ", index);
    areaId = self.areaArrayId[index];
    console.log("self.areaArrayId: ", self.areaArrayId);
    console.log("setArea() areaId: ", areaId);
    IdFactory.setArea(areaId);
    selectedAreaName = self.areaArray[index];

    $location.path('/measurement/' + surveyId + '/' + areaId + '/' + selectedAreaName);
  }


  //function to add a new area
  self.showInput = function() {
    self.inputAreaName = true;
  }
  self.showConfirm = function(ev) {
    // Appending dialog to document.body to cover sidenav in docs app
    if(self.toRemove.indexOf(true) != -1) {
      var confirm = $mdDialog.confirm()
        .title('Are you sure you wish to delete the selected areas and all associated measurements and files')
        .targetEvent(ev)
        .ok('Yes. Delete areas.')
        .cancel('No. Go back to areas');
      $mdDialog.show(confirm).then(function() {
        deleteAreas();
      }, function() {
      });
    }
  };

  self.areaClick = function(index) {
    if(self.editAreas) {
      self.toRemove[index]=!self.toRemove[index];
    } else {
      self.setArea(index);
      self.editAreas = true;
    }
  }
  function deleteAreas() {
    self.loading = false;
    var deleteIds = [];
    // var currentUser = UserFactory.getUser();
    for (var i = 0; i < self.toRemove.length; i++) {
      if (self.toRemove[i]) {
        deleteIds.push(self.areaArrayId[i])
      }
    }
    console.log('deleteIds', deleteIds);
    currentUser.getToken()
      .then(function(idToken) {
        $http({
          method: 'DELETE',
          url: '/areas/',
          params: {
            "id[]": deleteIds
          },
          headers: {
            id_token: idToken
          }
        }).then(function(response){
          //get survey details on last iteration
          getSurveyDetails();
          console.log('deletes complete')
        },
        function(err) {
          console.log("error with delete: ", err);
    });
    });
  }

  self.addNewArea = function() {
    console.log("Clicked Add New Area:");
    self.inputAreaName = false;
    self.newArea = {
      area_name: self.newAreaName,
      survey_id: surveyId,
      notes: ""
    }
    console.log("New Area Object: ", self.newArea);
    // currentUser = UserFactory.getUser();

    currentUser.getToken()
      .then(function(idToken) {
        $http({
          method: 'POST',
          url: '/areas/',
          data: self.newArea,
          headers: {
            id_token: idToken
          }
        }).then(function(response){
          console.log("Response from new area post: ", response.data[0].id);
          //We shouldn't really need to do this anymore, as we're storing this info in the url now
          areaId = response.data[0].id;
          IdFactory.setArea(areaId);
          //We do need to do this now.
          $location.path('/measurement/' + surveyId + '/' + areaId + '/' + self.newAreaName);
        },
        function(err) {
          console.log("error getting survey details: ", err);
        });
    })
  }
  //Edit client profile button
  self.editClient = function(){
    console.log("clicked");
    self.showInput = !self.showInput;
  }
  //save edits to client profile button
  self.updateClient = function(){
    var clientId = self.companyInfo.client_id;
    console.log("Update client clicked, clientId: ", clientId, self.companyInfo);
    // var currentUser = UserFactory.getUser();
    currentUser.getToken()
    .then(function(idToken) {
      $http({
        method: 'POST',
        url: '/clients/'+ clientId,
        data: self.companyInfo,
        headers: {
          id_token: idToken
        }
      }).then(function(response){
        console.log("Response from new area post: ", response.data);
        self.showInput = !self.showInput;
      },
      function(err) {
        console.log("error getting survey details: ", err);
      });
    });
  }
  //function to handle clicking of an already existing area

  //function to get all areas associated with survey or just company and survey information if the survey is new
  function getSurveyDetails(firebaseUser) {
    // var currentUser = UserFactory.getUser();
    if(firebaseUser) {
      user = firebaseUser;
    } else {
      user = currentUser;
    }
    user.getToken()
      .then(function(idToken) {
        $http({
          method: 'GET',
          url: '/surveys/one/' + surveyId,
          headers: {
            id_token: idToken
          }
        })
        .then(function(response){
          self.surveyDetails = response.data;
          //Check to see if it is a new survey. Length will be zero if it is a new survey
          if (self.surveyDetails.length === 0) {
            surveyHasAreas = false;
            user.getToken()
              .then(function(idToken) {
                $http({
                  method: 'GET',
                  url: '/surveys/new/' + surveyId,
                  headers: {
                    id_token: idToken
                  }
                })
                .then(function(response){
                  self.surveyDetails = response.data;
                  surveyOps();
                },
                function(err) {
                  console.log("error getting survey details: ", err);
                });
            });
          } else {
            surveyOps();
          }
        },
        function(err) {
          console.log("error getting survey details: ", err);
        });
    });
  }

  function surveyOps() {
    console.log("surveyOps Running");
    self.companyInfo = self.surveyDetails[0];
    if(surveyHasAreas) {
      self.areaArray = [...new Set(self.surveyDetails.map(survey => survey.area_name))];
      self.areaArrayId = [...new Set(self.surveyDetails.map(survey => survey.id))];

      for (var i = 0; i < self.areaArray.length; i++) {
        self.toRemove[i] = false;
      }
    }
    self.completionDate = new Date(self.companyInfo.completion_date);
    self.surveyDate = new Date(self.companyInfo.survey_date);
    self.editAreas = false;
    self.loading = true;
    console.log("Response From Server: ", self.surveyDetails);
    console.log("Area Array: ", self.areaArray);
    console.log("Area ID: ", self.areaArrayId);
    surveyHasAreas = true;
  }
  // getSurveyDetails(firebaseUser);
  //This happens when when we switch to this view/controller AND when page is refreshed
  UserFactory.auth.$onAuthStateChanged(function(firebaseUser) {
    if (!firebaseUser) {
      console.log("No User");
      self.loggedOut = true;
      $timeout(function() {
        $location.path('/login');
      }, 3000);
    }
    currentUser = firebaseUser;
    getSurveyDetails(firebaseUser);
  });

  self.survey = function() {
    IdFactory.setSurvey(surveyId);
    console.log("\n\nsurveyId in ma.survey: ", surveyId);
    $location.path('/survey/' + surveyId);
  }

}]);

//Function to group measurements by area
function groupBy(arr, property) {
  return arr.reduce(function(memo, x) {
    if (!memo[x[property]]) { memo[x[property]] = []; }
    memo[x[property]].push(x);
    return memo;
  }, {});
}
