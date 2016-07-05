'use strict';

const angular = require('angular');
const app = angular.module('app');
const {humanReadableSize} = require('./uiformatters');

app.controller('seriesCtrl', seriesCtrl);

seriesCtrl.$inject = ['$scope', 'organizerStore'];

function seriesCtrl($scope, organizerStore) {
  /*jshint validthis: true */
  const vm = this;
  vm.humanReadableSize = humanReadableSize;
  updateTable(organizerStore.get().seriesDicoms);

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
    let sessions = new Map();
    vm.dicoms = [];
    (seriesDicoms||[]).forEach((dicom) => {
      if (!sessions.has(dicom.sessionUID)) {
        sessions.set(
          dicom.sessionUID,
          {
            acqMap: new Map(),
            sessionTimestamp: dicom.sessionTimestamp,
            patientID: dicom.patientID
          }
        );
      }
      let {acqMap} = sessions.get(dicom.sessionUID);
      if (!acqMap.has(dicom.acquisitionUID)) {
        acqMap.set(
          dicom.acquisitionUID,
          {
            acquisitionLabel: dicom.acquisitionLabel,
            acquisitionTimestamp: dicom.acquisitionTimestamp,
            count: 0,
            size: 0
          }
        );
      }
      let acquisition = acqMap.get(dicom.acquisitionUID);
      acquisition.count += 1;
      acquisition.size += dicom.size;
    });
    let even = false;
    sessions.forEach((session) => {
      let first = true;
      session.acqMap.forEach(
        (v) => {
          if (first) {
            vm.dicoms.push({
              session: session.sessionTimestamp,
              patient: session.patientID,
              acquisition: v,
              even: even
            });
            first = false;
          } else {
            vm.dicoms.push({
              session: '',
              patient: '',
              acquisition: v,
              even: even
            });
          }
        }
      );
      even = !even;
    });
  }
}
