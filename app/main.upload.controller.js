'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('uploadCtrl', uploadCtrl);

uploadCtrl.$inject = ['$rootScope', '$timeout', 'organizerStore', 'organizerUpload'];

function uploadCtrl($rootScope, $timeout, organizerStore, organizerUpload){
  /*jshint validthis: true */
  const vm = this;
  vm.url = 'docker.local.flywheel.io:8443';
  vm.loadGroups = function loadGroups() {
    if (vm.url && vm.apiKey){
      organizerUpload.loadGroups(vm.url, vm.apiKey, true).then(function(groups){
        console.log(groups);
        vm.groups = JSON.parse(groups);
        $rootScope.$apply();
      },
      function(err) {
        throw err;
      }
    );
    }
  };

  vm.upload = function upload() {
    console.log(vm.url);
    let projects = organizerStore.get().projects;
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
          const zipPromise = organizerUpload.createZipBuffer(acquisition.filepaths, metadata);
          zipPromise.then(function(zip) {
            let files = [{
              content: zip,
              name: filename
            }];
            organizerUpload.upload(vm.url, files, metadata, vm.apiKey, true).then(()=>{
              progress.size += acquisition.size;
              progress.state = 100.0 * progress.size/size;
              if (progress.state >= 100.0){
                progress.size = 0;
                $timeout(function(){
                  progress.state = 0;
                  $rootScope.$apply();
                }, 1000);
              }
              $rootScope.$apply();
            });
          });
        });
      });
    });
  };
}
