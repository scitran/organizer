'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;

app.controller('mainCtrl', mainCtrl);

mainCtrl.$inject = ['$state', 'organizerStore'];

function mainCtrl($state, organizerStore) {
  /*jshint validthis: true */
  const vm = this;
  vm.viewType = 'bids-to-series';
  Object.assign(vm, {
    selectFolder: selectFolder,
    updateView: updateView
  });
  console.log(organizerStore);
  vm.instances = organizerStore.get().instances;

  function selectFolder() {
    ipc.send('open-file-dialog', vm.viewType);
  }
  function updateView() {
    $state.go('main.' + vm.viewType);
  }
  updateView();
}
