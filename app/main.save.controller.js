'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;

app.controller('saveCtrl', saveCtrl);

saveCtrl.$inject = ['steps', 'organizerStore', 'projectsService'];

function saveCtrl(steps, organizerStore, projectsService){
  /*jshint validthis: true */
  const vm = this;
  steps.complete();
  vm.save = function save(){
    ipc.send('open-file-dialog', steps.current());
    ipc.once('selected-directory', function (event, path) {
      console.log(path);
      let projects = organizerStore.get().projects;
      projectsService.save(projects, path[0]);
    });
  };
}
