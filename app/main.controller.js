'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('mainCtrl', mainCtrl);

mainCtrl.$inject = ['$rootScope', 'steps', 'organizerStore'];

function mainCtrl($rootScope, steps, organizerStore){
  /*jshint validthis: true */
  /*jshint validthis: true */
  const vm = this;
  $rootScope.steps = steps;
  steps.configure('main.load',{
    'main.load': {
      next: () => 'main.organize',
      isActive: true
    },
    'main.organize': {
      next: () => 'main.save'
    },
    'main.save': {
      next: () => 'main.upload'
    },
    'main.upload': {}
  });
  vm.progress = organizerStore.get().progress;
  vm.success = organizerStore.get().success;
}
