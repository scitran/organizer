'use strict';

const angular = require('angular');
const app = angular.module('app');
const ipc = require('electron').ipcRenderer;

app.controller('loadCtrl', loadCtrl);

loadCtrl.$inject = ['$timeout', '$rootScope', 'steps', 'organizerStore', 'dicom'];

function loadCtrl($timeout, $rootScope, steps, organizerStore, dicom) {
  /*jshint validthis: true */
  const vm = this;
  vm.selectFolder = selectFolder;
  if (organizerStore.get().loaded.size){
    steps.complete();
  }
  function selectFolder() {
    ipc.send('open-file-dialog', steps.current());
    console.log(steps.current());
    ipc.once('selected-directory', function (event, path) {
      const busy = organizerStore.get().busy;
      const success = organizerStore.get().success;
      busy.state = true;
      $rootScope.$apply();
      const subject = dicom.sortDicoms(path[0]);
      subject.subscribe(
        (dicomsOrMessage) => {
          if (dicomsOrMessage.message !== undefined){
            console.log(dicomsOrMessage.message);
            organizerStore.update({message: dicomsOrMessage});
          } else if (dicomsOrMessage.error !== undefined){
            console.log(dicomsOrMessage.error);
            organizerStore.update({error: dicomsOrMessage.error});
          } else {
            organizerStore.update({dicoms: dicomsOrMessage});
            steps.complete();
            busy.state = false;
            success.state = 'success';
            $rootScope.$apply();
            $timeout(function(){
              success.state = '';
              $rootScope.$apply();
            }, 2000);
            steps.next();
          }
        },
        (err) => {
          console.log(err);
          organizerStore.update({error: err});
        },
        () => {
          console.log('Processing completed.');
        }
      );
    });
  }
}
