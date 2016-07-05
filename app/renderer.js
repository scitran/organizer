'use strict';
const angular = require('angular');
const app = angular.module('app', [require('angular-ui-router')]);
const ipc  = require('electron').ipcRenderer;

require('./dicom.js');
require('./store.js');
require('./main.controller.js');
require('./main.series.controller.js');
require('./main.bids.controller.js');
document.addEventListener('DOMContentLoaded', boot);

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise('/main');

  //
  // Now set up the states
  const main = {
    url: '/main',
    controller: 'mainCtrl',
    controllerAs: 'main',
    templateUrl: 'partials/main.html'
  };
  $stateProvider
    .state('main', main)
    .state('main.series', {
      url: '/main/series',
      parent: main,
      controller: 'seriesCtrl',
      controllerAs: 'series',
      templateUrl: 'partials/series-table.html'
    })
    .state('main.bids', {
      url: '/main/bids',
      parent: main,
      controller: 'bidsCtrl',
      controllerAs: 'bids',
      templateUrl: 'partials/bids-table.html'
    });
});
app.run(run);

run.$inject = ['$state', 'dicom', 'organizerStore'];

function run($state, dicom, organizerStore) {
  $state.go('main');
  ipc.on('selected-directory', function (event, path) {
    const subject = dicom.sortDicoms(path[0]);
    subject.subscribe(
      (dicomsOrMessage) => {
        if (dicomsOrMessage.message !== undefined){
          console.log(dicomsOrMessage.message);
          organizerStore.update({message: dicomsOrMessage});
        } else {
          organizerStore.update({dicoms: dicomsOrMessage});
        }
      },
      (err) => {
        console.err(err);
        organizerStore.update({error: err});
      },
      () => {
        console.log('Rendering completed.');
      }
    );
  });
}

function boot() {
  angular.bootstrap(document, ['app'], {
    strictDi: false
  });
}
