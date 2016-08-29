'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;

app.controller('loadCtrl', loadCtrl);

loadCtrl.$inject = ['steps', 'organizerStore', 'dicom'];

function loadCtrl(steps, organizerStore, dicom) {
  console.log('boom');
  /*jshint validthis: true */
  const vm = this;
  vm.selectFolder = selectFolder;
  function selectFolder() {
    ipc.send('open-file-dialog', steps.current());
    console.log(steps.current());
    ipc.once('selected-directory', function (event, path) {
      const subject = dicom.sortDicoms(path[0]);
      subject.subscribe(
        (dicomsOrMessage) => {
          if (dicomsOrMessage.message !== undefined){
            console.log(dicomsOrMessage.message);
            organizerStore.update({message: dicomsOrMessage});
          } else {
            organizerStore.update({dicoms: dicomsOrMessage});
            steps.complete();
            steps.next();
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
