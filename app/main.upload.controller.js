'use strict';

const angular = require('angular');
const app = angular.module('app');
const path = require('path');

app.controller('uploadCtrl', uploadCtrl);

uploadCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'organizerStore', 'organizerUpload', 'zipQueues', 'config'];

// jshint maxparams:7
function uploadCtrl($scope, $rootScope, $timeout, organizerStore, organizerUpload, zipQueues, config){
  /*jshint validthis: true */
  function updateAsync(body) {
    const {success, busy} = organizerStore.get();
    Object.assign(success, {
      state: '',
      reason: ''
    }, body.success);
    Object.assign(busy, {
      state: false,
      reason: ''
    }, body.busy);
  }
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
    let projects = organizerStore.get().projects;
    const progress = organizerStore.get().progress;
    updateAsync({ busy: { state: true, reason: 'Uploading data...' } });
    projects.forEach((p) => {
      if (p.state !== 'checked' && p.state !== 'indeterminate'){
        return;
      }
      const metadataBase = {
        'group': {_id: vm.destinationGroup._id},
        'project': {label: p.label}
      };
      const uploads = Object.keys(p.children).map((sessionUID) => {
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
        const size = organizerStore.get().loaded.size;
        progress.size = 0;
        return Promise.all(acqKeys.map((acquisitionUID) => {
          const acquisition = session.children[acquisitionUID];
          if (acquisition.state !== 'checked' && acquisition.state !== 'indeterminate'){
            return;
          }
          if (!acquisition.parsedFiles.length) {
            // We skip upload for acquisitions with no new files.
            return;
          }
          const dicomPaths = [];
          const filesForUpload = [];
          const metadataAcq = {
            acquisition: {
              'uid': acquisition.acquisitionUID,
              'label': acquisition.acquisitionLabel,
              'timestamp': acquisition.acquisitionTimestamp.ts,
              'files': []
            }
          };
          for (const parsedFile of acquisition.parsedFiles) {
            if (parsedFile.type === 'dicom') {
              dicomPaths.push(parsedFile.path);
            } else {
              const name = path.basename(parsedFile.path);
              metadataAcq.acquisition.files.push({
                name,
                type: parsedFile.type
              });
              filesForUpload.push({
                name,
                content: parsedFile.content
              });
            }
          }
          // We zip up dicoms for an acquisition before uploading.
          // Other data is uploaded without modification.
          const zipPromise = dicomPaths.length ?
            zipQueues.append({files: dicomPaths}) : Promise.resolve();
          return zipPromise.then(function(zip) {
            if (dicomPaths.length) {
              const dicomFilename = acquisitionUID + '.zip';
              metadataAcq.acquisition.files.push({
                name: dicomFilename,
                type: 'dicom'
              });
              filesForUpload.push({
                name: dicomFilename,
                content: zip
              });
            }
            const metadata = JSON.stringify(Object.assign(
              {},
              metadataBase,
              metadataSes,
              metadataAcq
            ));
            return organizerUpload.upload(vm.url, filesForUpload, metadata, vm.apiKey, vm.asRoot).then(function() {
              progress.size += acquisition.size;
              progress.state = 100.0 * progress.size/size;
              $rootScope.$apply();
            });
          });
        }));
      });
      Promise.all(uploads).then(()=>{
        progress.state = 0;
        updateAsync({ success: { state: 'success' } });
        $timeout(function(){
          updateAsync({ success: { state: '' } });
          $rootScope.$apply();
        }, 2000);
        $rootScope.$apply();
      }, (err) => {
        updateAsync({ success: {
          state: 'failure',
          reason: `: ${err.message}`
        } });
        $rootScope.$apply();
        $scope.$on('$destroy', function(){
          updateAsync({ success: { state: '' } });
          progress.state = 0;
          $rootScope.$apply();
        });
      });
    });
  };
}
