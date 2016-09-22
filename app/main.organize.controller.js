'use strict';

const angular = require('angular');
const app = angular.module('app');
const {humanReadableSize} = require('./common/uiformatters.js');

app.controller('organizeCtrl', organizeCtrl);

organizeCtrl.$inject = ['steps', 'organizerStore'];

function organizeCtrl(steps, organizerStore){
  /*jshint validthis: true */
  const vm = this;
  updateTable();
  vm.handleKeyOnInput = handleKeyOnInput;
  vm.humanReadableSize = humanReadableSize;
  vm.select = select;

  steps.complete();
  function select(container, value) {
    const initialValue = container.state;
    if (typeof value !== 'undefined') {
      container.state = value;
    } else if (container.state === 'checked'){
      container.state = false;
    } else {
      container.state = 'checked';
    }
    const childContainers = container.children || {};
    container.selectedCount = 0;
    container.indeterminateCount = 0;
    for (let k of Object.keys(childContainers)){
      select(childContainers[k], container.state);
    }
    if (container.state) {
      container.selectedCount = Object.keys(childContainers).length;
    }
    if (typeof value === 'undefined' && container.parent) {
      updateParent(container.parent, initialValue, container.state);
    }
  }
  function updateParent(container, oldValue, newValue) {
    const initialValue = container.state;
    container.selectedCount = container.selectedCount || 0;
    container.indeterminateCount = container.indeterminateCount || 0;
    if (oldValue === 'indeterminate') {
      container.indeterminateCount -= 1;
    } else if (oldValue === 'checked') {
      container.selectedCount -= 1;
    }
    if (newValue === 'checked') {
      container.selectedCount += 1;
    } else if (newValue === 'indeterminate') {
      container.indeterminateCount += 1;
    }
    const numChildren = Object.keys(container.children).length;
    if (container.selectedCount === numChildren) {
      container.state = 'checked';
    } else if (container.indeterminateCount + container.selectedCount > 0) {
      container.state = 'indeterminate';
    } else {
      container.state = false;
    }
    if (container.parent){
      updateParent(container.parent, initialValue, container.state);
    }
  }

  function updateTable() {
    const seriesDicoms = organizerStore.get().seriesDicoms||[];
    let sessions = {};
    let project = {
      label: 'Untitled',
      children: sessions
    };
    seriesDicoms.forEach((dicom) => {
      if (!sessions.hasOwnProperty(dicom.sessionUID)) {
        sessions[dicom.sessionUID] = {
          children: {},
          sessionTimestamp: dicom.sessionTimestamp,
          patientID: dicom.patientID,
          parent: project
        };
      }
      let acquisitions = sessions[dicom.sessionUID].children;
      if (!acquisitions.hasOwnProperty(dicom.acquisitionUID)) {
        acquisitions[dicom.acquisitionUID] = {
          filepaths: [],
          acquisitionLabel: dicom.acquisitionLabel,
          acquisitionTimestamp: dicom.acquisitionTimestamp,
          count: 0,
          size: 0,
          parent: sessions[dicom.sessionUID]
        };
      }
      let acquisition = acquisitions[dicom.acquisitionUID];
      acquisition.count += 1;
      acquisition.size += dicom.size;
      acquisition.filepaths.push(dicom.path);
    });
    vm.projects = [project];
    organizerStore.update({projects: vm.projects});
    vm.loaded = true;
  }
  function handleKeyOnInput(container, field, event) {
    if (!container['_' + field]) {
      return;
    } else if (event.which === 13) {
      container[field] = container['_' + field];
      organizerStore.update({projects: vm.projects});
      container.editing = !container.editing;
    } else if (event.which === 27) {
      container.editing = !container.editing;
    }
  }
}
