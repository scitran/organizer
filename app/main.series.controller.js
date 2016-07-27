'use strict';

const angular = require('angular');
const app = angular.module('app');
const {humanReadableSize} = require('./common/uiformatters');

app.controller('seriesCtrl', seriesCtrl);

seriesCtrl.$inject = ['$scope', 'organizerStore'];

function seriesCtrl($scope, organizerStore) {
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
          acquisitionLabel: dicom.acquisitionLabel,
          acquisitionTimestamp: dicom.acquisitionTimestamp,
          count: 0,
          size: 0
        };
      }
      let acquisition = acquisitions[dicom.acquisitionUID];
      acquisition.count += 1;
      acquisition.size += dicom.size;
    });
    vm.projects = [
      {
        label: 'Untitled',
        sessions: sessions
      }
    ];
    vm.loaded = true;
  }
}
