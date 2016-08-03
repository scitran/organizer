'use strict';
const angular = require('angular');
const app = angular.module('app', [require('angular-ui-router')]);
const ipc  = require('electron').ipcRenderer;

require('./services/bids.js');
require('./services/dicom.js');
require('./services/store.js');
require('./services/uploader.js');
require('./services/apiQueues.js');
require('./main.controller.js');
require('./main.series.controller.js');
require('./main.bids.controller.js');
require('./main.bidsToSeries.controller.js');
document.addEventListener('DOMContentLoaded', boot);

function boot() {
  angular.bootstrap(document, ['app'], {
    strictDi: false
  });
}

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
    })
    .state('main.bids-to-series', {
      url: '/main/sortedSeries',
      controller: 'sortedSeriesCtrl',
      controllerAs: 'sortedSeries',
      templateUrl: 'partials/sorted-series-table.html'
    });
});
app.run(run);

run.$inject = ['$state', 'bids', 'dicom', 'organizerStore'];

function run($state, bids, dicom, organizerStore) {
  $state.go('main');
  organizerStore.update({instances: ['docker.local.flywheel.io']});
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
        console.log('Processing completed.');
      }
    );
  });
  ipc.on('selected-bids-directory', function(event, path){
    bids.bidsToSeries(path[0]).subscribe(
      function(sortedSeries) {
        console.log(sortedSeries);
        organizerStore.update({sortedSeries: sortedSeries});
      },
      function(err) {
        console.log('Err: %s', err);
        organizerStore.update({error: err});
      },
      function() {
        console.log('Processing completed');
      }
    );
  });
}
