'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;
const {mapToSeriesRow} = require('./uiformatters');

app.controller('mainCtrl', mainCtrl);

mainCtrl.$inject = ['$state', 'organizerStore'];

function mainCtrl($state, organizerStore) {
  /*jshint validthis: true */
  const vm = this;
  vm.viewType = 'series';
  Object.assign(vm, {
    selectFolder: selectFolder,
    updateView: updateView
  });
  console.log(organizerStore);
  organizerStore.changed.subscribe(
    (action) => {
      const update = action.update;
      //jshint unused:false
      if (typeof update.dicoms !== 'undefined'){
        vm.dicoms = update.dicoms;
        organizerStore.update({
          seriesDicoms: mapToSeriesRow(vm.dicoms)
        });
      }
    }
  );
  function selectFolder() {
    ipc.send('open-file-dialog');
  }
  function updateView() {
    $state.go('main.' + vm.viewType);
  }
  updateView();
}
