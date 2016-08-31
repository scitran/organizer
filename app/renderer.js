/* global process */
'use strict';

// enables autoreload HTML if process is HOT
if (process.env.HOT) {
  require('../partials/main.html');
  require('../partials/load.html');
  require('../partials/upload.html');
  require('../partials/organize.html');
  require('../index.html');
}
require('../css/global.css');

const angular = require('angular');
const app = angular.module('app', [require('angular-ui-router')]);
//const ipc  = require('electron').ipcRenderer;

require('./filters/objLength.js');
require('./services/dicom.js');
require('./services/steps.js');
require('./services/store.js');
require('./services/uploader.js');
require('./services/apiQueues.js');
require('./main.controller.js');
require('./main.load.controller.js');
require('./main.format.controller.js');
require('./main.organize.controller.js');
require('./main.upload.controller.js');
document.addEventListener('DOMContentLoaded', boot);

function boot() {
  angular.bootstrap(document, ['app'], {
    strictDi: false
  });
}

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise('/main/load');

  //
  // Now set up the states
  const main = {
    url: '/main',
    templateUrl: 'partials/main.html',
    controller: 'mainCtrl',
    controllerAs: 'main'
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
      templateUrl: 'partials/organize.html',
      controller: 'organizeCtrl',
      controllerAs: 'organize'
    })
    .state('main.save', {
      url: '/main/save',
      parent: main,
      templateUrl: 'partials/save.html'
    })
    .state('main.upload', {
      url: '/main/upload',
      parent: main,
      templateUrl: 'partials/upload.html',
      controller: 'uploadCtrl',
      controllerAs: 'upload'
    })
    .state('main.series', {
      url: '/main/series',
      parent: main,
      controller: 'seriesCtrl',
      controllerAs: 'series',
      templateUrl: 'partials/series-table.html'
    });
});
app.run(run);

run.$inject = ['$state'];

// jshint maxparams:6
function run($state) {
  $state.go('main');
}
