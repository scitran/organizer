'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('formatCtrl', formatCtrl);

formatCtrl.$inject = ['$state', 'organizerStore'];

function formatCtrl($state, organizerStore){
  /*jshint validthis: true */
  const vm = this;
  vm.set = set;

  function set(format){
    organizerStore.update({format: format});
    vm.format = format;
  }
}
