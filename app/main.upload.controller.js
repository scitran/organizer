'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('uploadCtrl', uploadCtrl);

uploadCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'organizerStore', 'organizerUpload', 'zipQueues', 'config'];

// jshint maxparams:7
function uploadCtrl($scope, $rootScope, $timeout, organizerStore, organizerUpload, zipQueues, config){
  /*jshint validthis: true */
  const vm = this;
  vm.projectWarning = '';
  vm.asRoot = false;
  vm.url = config.getItem('url') || '';
  vm.loadGroups = function loadGroups() {
    if (vm.url && vm.apiKey){
      config.setItem('url', vm.url);
      organizerUpload.loadGroups(vm.url, vm.apiKey, vm.asRoot).then(function(groups){
        vm.groups = JSON.parse(groups);
        $rootScope.$apply();
      },
      function(err) {
        throw err;
      }
    );
    }
  };
  vm.reloadGroups = function reloadGroups() {
    if (vm.groups.length) {
      vm.loadGroups();
      vm.destinationGroup = null;
    }
  };
  vm.loadProjects = function loadProjects() {
    if (vm.url && vm.apiKey){
      organizerUpload.loadProjects(vm.url, vm.apiKey, vm.destinationGroup._id, vm.asRoot).then(function(projects){
        vm.projects = JSON.parse(projects);
        const intersection = vm.projects.filter((p) => {
          return organizerStore.get().projects.find((p1) => {
            return (p1.label.toLowerCase() === p.label.toLowerCase());
          });
        }).map((p) => p.label);
        if (intersection.length) {
          vm.projectWarning = `Some of the projects (${intersection}) already exist!`;
        }
        $rootScope.$apply();
      },
      function(err) {
        throw err;
      }
    );
    }
  };

  vm.upload = function upload() {
    const success = organizerStore.get().success;
    let projects = organizerStore.get().projects;
    const busy = organizerStore.get().busy;
    busy.state = true;
    busy.reason = 'Uploading data...';
    projects.forEach((p) => {
      if (p.state !== 'checked' && p.state !== 'indeterminate'){
        return;
      }
      const metadataBase = {
        'group': {_id: vm.destinationGroup._id},
        'project': {label: p.label}
      };
      Object.keys(p.children).forEach((sessionUID) => {
        const session = p.children[sessionUID];
        if (session.state !== 'checked' && session.state !== 'indeterminate'){
          return;
        }
        const metadataSes = {
          'session': {
            'label': sessionUID,
            'timestamp': session.sessionTimestamp.ts,
            'subject': {
              'code': session.patientID
            }
          }
        };
        const acqKeys = Object.keys(session.children);
        const progress = organizerStore.get().progress;
        const size = organizerStore.get().loaded.size;
        progress.size = 0;
        acqKeys.forEach((acquisitionUID) => {
          const acquisition = session.children[acquisitionUID];
          if (acquisition.state !== 'checked' && acquisition.state !== 'indeterminate'){
            return;
          }
          const filename = acquisitionUID + '.zip';
          const metadataAcq = {
            acquisition: {
              'uid': acquisition.acquisitionUID,
              'label': acquisition.acquisitionLabel,
              'timestamp': acquisition.acquisitionTimestamp.ts,
              'files': [{
                name: filename,
                type: 'dicom'
              }]
            }
          };
          const metadata = JSON.stringify(Object.assign(
            {},
            metadataBase,
            metadataSes,
            metadataAcq
          ));
          const zipPromise = zipQueues.append({files: acquisition.filepaths});
          zipPromise.then(function(zip) {
            let files = [{
              content: zip,
              name: filename
            }];
            organizerUpload.upload(vm.url, files, metadata, vm.apiKey, vm.asRoot).then(()=>{
              progress.size += acquisition.size;
              progress.state = 100.0 * progress.size/size;
              if (progress.state >= 100.0){
                progress.state = 0;
                success.state = 'success';
                busy.state = false;
                busy.reason = '';
                $timeout(function(){
                  success.state = '';

                  $rootScope.$apply();
                }, 2000);
              }
              $rootScope.$apply();
            },
            (err) => {
              success.state = 'failure';
              console.log(err);
              success.reason = ': an error occurred';
              busy.state = false;
              $rootScope.$apply();
              $scope.$on('$destroy', function(){
                success.state = '';
                progress.state = 0;
                $rootScope.$apply();
              });
            }
          );
          });
        });
      });
    });
  };
}
