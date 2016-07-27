'use strict';

const angular = require('angular');
const app = angular.module('app');
const {humanReadableSize} = require('./common/uiformatters');

app.controller('seriesCtrl', seriesCtrl);

seriesCtrl.$inject = ['$scope', 'organizerStore', 'organizerUpload'];

function seriesCtrl($scope, organizerStore, organizerUpload) {
  /*jshint validthis: true */
  const vm = this;
  vm.projects= [];
  vm.humanReadableSize = humanReadableSize;

  organizerStore.changed.subscribe(
    (action) => {
      const update = action.update;
      if (typeof update.seriesDicoms !== 'undefined') {
        updateTable(update.seriesDicoms);
        $scope.$apply();
      }
    }
  );

  function updateTable(seriesDicoms) {
    let sessions = {};
    (seriesDicoms||[]).forEach((dicom) => {
      if (!sessions.hasOwnProperty(dicom.sessionUID)) {
        sessions[dicom.sessionUID] = {
          acquisitions: {},
          sessionTimestamp: dicom.sessionTimestamp,
          patientID: dicom.patientID
        };
      }
      let {acquisitions} = sessions[dicom.sessionUID];
      if (!acquisitions.hasOwnProperty(dicom.acquisitionUID)) {
        acquisitions[dicom.acquisitionUID] = {
          filepaths: [],
          acquisitionLabel: dicom.acquisitionLabel,
          acquisitionTimestamp: dicom.acquisitionTimestamp,
          count: 0,
          size: 0
        };
      }
      let acquisition = acquisitions[dicom.acquisitionUID];
      acquisition.count += 1;
      acquisition.size += dicom.size;
      acquisition.filepaths.push(dicom.path);
    });
    vm.projects = [
      {
        label: 'Untitled',
        sessions: sessions
      }
    ];
    vm.loaded = true;
  }

  vm.upload = function upload() {
    console.log(vm.projects);
    vm.projects.forEach((p) => {
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
          if (acquisition.selected) {
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
              const answer = organizerUpload.upload(vm.selectedInstance, filename, zip, metadata);
              console.log(answer);
            });

          }
        });
      });
    });

  };
}
