'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;

app.controller('loadCtrl', loadCtrl);

loadCtrl.$inject = ['$state', 'organizerStore', 'dicom'];

function loadCtrl($state, organizerStore, dicom) {
  console.log('boom');
  /*jshint validthis: true */
  const vm = this;
  vm.selectFolder = selectFolder;
  function selectFolder() {
    ipc.send('open-file-dialog', $state.current.name);
    console.log($state.current.name);
    ipc.once('selected-directory', function (event, path) {
      const subject = dicom.sortDicoms(path[0]);
      subject.subscribe(
        (dicomsOrMessage) => {
          if (dicomsOrMessage.message !== undefined){
            console.log(dicomsOrMessage.message);
            organizerStore.update({message: dicomsOrMessage});
          } else {
            organizerStore.update({dicoms: dicomsOrMessage});
            $state.go('main.format')
          }
        },
        (err) => {
          console.err(err);
          organizerStore.update({error: err});
        },
        () => {
          console.log('Processing completed.');
        }
      );
    });
  }
}
