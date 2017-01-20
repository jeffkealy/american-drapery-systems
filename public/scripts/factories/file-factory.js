/**********************
Create file factory
***********************/
app.factory('FileFactory', ['$http', 'MultipartForm',
function($http, MultipartForm) {

  var fileFactory = {

    newFilesObject: {
      files: FileList,
      filesInfo: {}
    },

    currentFilesObject: {},

    updateFiles: function(newFiles) {
      fileFactory.newFilesObject.files = newFiles.files;
      fileFactory.newFilesObject.filesInfo = newFiles.filesInfo;
      console.log("Files now in FileFactory: ", fileFactory.newFilesObject.files, fileFactory.newFilesObject.filesInfo);
    },

    getFiles: function(currentUser, areaId) {
      console.log("current user in get files: ", currentUser);
      return currentUser.getToken().then(function(idToken) {
        return $http({
          method: 'GET',
          url: '/files/' + areaId,
          headers: {
            id_token: idToken
          }
        }).then(function(response) {
          // return console.log("Recieved this info from the server in FileFactory GET req: ", response);\
          console.log("RESPONSE IN FILE FACTORY: ", response);
          for (var i = 0; i < response.data.length; i++) {
            let currentFile = response.data[i];
            //create file property(subobject):
            fileFactory.currentFilesObject["file_" + (i + 1)] = {};
            //add data to file property subobject:
            fileFactory.currentFilesObject["file_" + (i + 1)].areaId = currentFile.area_id;
            fileFactory.currentFilesObject["file_" + (i + 1)].bucket = currentFile.bucket;
            fileFactory.currentFilesObject["file_" + (i + 1)].fileInfo = currentFile.file_info;
            fileFactory.currentFilesObject["file_" + (i + 1)].id = currentFile.id;
            fileFactory.currentFilesObject["file_" + (i + 1)].key = currentFile.key;
            fileFactory.currentFilesObject["file_" + (i + 1)].originalName = currentFile.original_name;
          }
          console.log("CURRENT FILES OBJECT: ", fileFactory.currentFilesObject);
          return fileFactory.currentFilesObject;
        })
      })
    },

    submitFiles: function(currentUser, surveyId, areaId) {
      var uploadUrl = '/files/' + areaId;
      console.log("submitFiles() running in FileFactory, sending files to server " +
      "Using route: ", uploadUrl);

      // fileExtensions(fileFactory.newFilesObject.files);


      return currentUser.getToken().then(function(idToken) {
        return MultipartForm.post(uploadUrl, surveyId, fileFactory.newFilesObject, idToken)
        .then(function(response) {
          return console.log("Response from server: ", response);
        });
      });
    }







  }

  return fileFactory;
}]);

  // IF WE NEED TO GET FILE EXTENSIONS, INSTEAD OF JUST NAMES:
  // function fileExtensions(files) {
  //   for(let i = 0; i < files.length; i++) {
  //     let name = files[i].name;
  //     let extension =  name.slice((Math.max(0, name.lastIndexOf(".")) || Infinity) + 1);
  //     fileFactory.newFilesObject.filesInfo.
  //     console.log(extension);
  //   }
  // }
