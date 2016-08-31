'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('organizeCtrl', organizeCtrl);

organizeCtrl.$inject = ['steps', 'organizerStore'];

function organizeCtrl(steps, organizerStore){
  /*jshint validthis: true */
  const vm = this;
  updateTable();
  vm.handleKeyOnInput = handleKeyOnInput;
  steps.complete();

  function updateTable() {
    const seriesDicoms = organizerStore.get().seriesDicoms||[];
    let sessions = {};
    seriesDicoms.forEach((dicom) => {
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
    organizerStore.update({projects: vm.projects});
    console.log(sessions);
    vm.loaded = true;
  }
  function handleKeyOnInput(container, field, event) {
    if (!container['_' + field]) {
      return;
    } else if (event.which === 13) {
      container[field] = container['_' + field];
      container.editing = !container.editing;
    } else if (event.which === 27) {
      container.editing = !container.editing;
    }
  }
}
