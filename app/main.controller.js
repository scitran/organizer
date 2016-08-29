'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('mainCtrl', mainCtrl);

mainCtrl.$inject = ['$state', 'organizerStore'];

function mainCtrl($state, organizerStore){
  /*jshint validthis: true */
  /*jshint validthis: true */
  const vm = this;
  $state.go('main.load');
  vm.progress = organizerStore.get().progress;
}
