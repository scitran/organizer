'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;

app.controller('mainCtrl', mainCtrl);

mainCtrl.$inject = ['$state', 'organizerStore'];

function mainCtrl($state, organizerStore) {
  /*jshint validthis: true */
  const vm = this;
  Object.assign(vm, {
    selectFolder: selectFolder,
    updateView: updateView
  });
  console.log(organizerStore);
  vm.instances = organizerStore.get().instances;

  function selectFolder() {
    ipc.send('open-file-dialog', vm.viewType);
  }
  function updateView(viewType) {
    vm.viewType = viewType;
    $state.go('main.' + vm.viewType);
  }
  updateView('load');
}
