'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('uploadCtrl', uploadCtrl);

uploadCtrl.$inject = ['organizerStore', 'organizerUpload'];

function uploadCtrl(organizerStore, organizerUpload){
  /*jshint validthis: true */
  const vm = this;

  vm.upload = function upload() {
    console.log(vm.url);
    let projects = organizerStore.get().projects;
    projects.forEach((p) => {
      const metadataBase = {
        'group': {_id: 'my_group'},
        'project': {label: p.label}
      };
      Object.keys(p.sessions).forEach((sessionUID) => {
        const session = p.sessions[sessionUID];
        const metadataSes = {
          'session': {
            'label': sessionUID,
            //'timestamp': session.timestamp,
            'subject': {
              'code': session.patientID
            }
          }
        };
        Object.keys(session.acquisitions).forEach((acquisitionUID) => {
          const acquisition = session.acquisitions[acquisitionUID];
          const filename = acquisitionUID + '.zip';
          const metadataAcq = {
            acquisition: {
              'label': acquisitionUID,
              //'timestamp': acquisition.acquisitionTimestamp,
              'files': [{
                name: filename
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
            let files = {
              content: zip,
              name: filename
            };
            organizerUpload.upload(vm.url, files, metadata);
          });
        });
      });
    });

  };
}
