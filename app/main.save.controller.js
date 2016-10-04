'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;

app.controller('saveCtrl', saveCtrl);

saveCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'steps', 'organizerStore', 'projectsService'];

// jshint maxparams:6
function saveCtrl($scope, $rootScope, $timeout, steps, organizerStore, projectsService){
  /*jshint validthis: true */
  const vm = this;

  steps.complete();
  const success = organizerStore.get().success;
  vm.save = function save(){
    ipc.send('open-file-dialog', steps.current());
    ipc.once('selected-directory', function (event, path) {
      console.log(path);
      let projects = organizerStore.get().projects;
      projectsService.save(projects, path[0]).then(
        function(){
          success.state = 'success';
          $rootScope.$apply();
          $timeout(function(){
            success.state = '';
            $rootScope.$apply();
          }, 2000);
        },
        function(error){
          success.state = 'failure';
          console.log(error);
          if (error.code === 'EEXIST'){
            success.reason = `: "${error.path} already exists"`;
          }
          $rootScope.$apply();
          $scope.$on('$destroy', function(){
            success.state = '';
            success.reason = '';
            $rootScope.$apply();
          });
        }
      );
    });
  };
}
