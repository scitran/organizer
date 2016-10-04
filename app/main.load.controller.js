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
      //organizerStore.update({errors: []});
      const busy = organizerStore.get().busy;
      const success = organizerStore.get().success;
      busy.state = true;
      busy.reason = 'Loading data...';
      $rootScope.$apply();
      const subject = dicom.sortDicoms(path[0]);
      subject.subscribe(
        (dicomsOrMessage) => {
          if (dicomsOrMessage.message !== undefined){
            console.log(dicomsOrMessage.message);
            organizerStore.update({message: dicomsOrMessage});
          } else if (dicomsOrMessage.errors !== undefined){
            console.log(dicomsOrMessage.errors);
            organizerStore.update({errors: dicomsOrMessage.errors});
          } else {
            organizerStore.update({dicoms: dicomsOrMessage});
            steps.complete();
            busy.state = false;
            busy.reason = '';
            const errors = organizerStore.get().errors;
            const errorsLength = errors?errors.length:0;
            let messageDelay = 2000;
            success.state = 'success';
            if (errorsLength) {
              success.state = 'warning';
              success.reason = `There have been ${errorsLength} errors out of ${dicomsOrMessage.length + errorsLength} files`;
              organizerStore.update({errors: []});
              messageDelay = 5000;
            }
            $rootScope.$apply();
            $timeout(function(){
              success.state = '';
              success.reason = '';
              $rootScope.$apply();
            }, messageDelay);
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
