'use strict';
const angular = require('angular');
const app = angular.module('app', [require('angular-ui-router')]);
const ipc  = require('electron').ipcRenderer;

require('./services/bids.js');
require('./services/dicom.js');
require('./services/store.js');
require('./services/uploader.js');
require('./services/apiQueues.js');
require('./main.series.controller.js');
require('./main.bids.controller.js');
require('./main.load.controller.js');
require('./main.format.controller.js');
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
    templateUrl: 'partials/main.html'
  };
  $stateProvider
    .state('main', main)
    .state('main.load', {
      url: '/main/load',
      parent: main,
      templateUrl: 'partials/load.html',
      controller: 'loadCtrl',
      controllerAs: 'load'
    })
    .state('main.format', {
      url: '/main/format',
      parent: main,
      templateUrl: 'partials/format.html',
      controller: 'formatCtrl',
      controllerAs: 'format'
    })
    .state('main.organize', {
      url: '/main/organize',
      parent: main,
      templateUrl: 'partials/organize.html'
    })
    .state('main.save', {
      url: '/main/save',
      parent: main,
      templateUrl: 'partials/save.html'
    })
    .state('main.upload', {
      url: '/main/upload',
      parent: main,
      templateUrl: 'partials/upload.html'
    })
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

run.$inject = ['$rootScope', '$state', '$stateParams', 'bids', 'dicom', 'organizerStore'];

// jshint maxparams:6
function run($rootScope, $state, $stateParams, bids, dicom, organizerStore) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $state.go('main');
  organizerStore.update({instances: ['docker.local.flywheel.io']});
  // ipc.on('selected-directory', function (event, path) {
  //   const subject = dicom.sortDicoms(path[0]);
  //   subject.subscribe(
  //     (dicomsOrMessage) => {
  //       if (dicomsOrMessage.message !== undefined){
  //         console.log(dicomsOrMessage.message);
  //         organizerStore.update({message: dicomsOrMessage});
  //       } else {
  //         organizerStore.update({dicoms: dicomsOrMessage});
  //       }
  //     },
  //     (err) => {
  //       console.err(err);
  //       organizerStore.update({error: err});
  //     },
  //     () => {
  //       console.log('Processing completed.');
  //     }
  //   );
  // });
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
