'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('saveCtrl', saveCtrl);

saveCtrl.$inject = ['steps'];

function saveCtrl(steps){
  /*jshint validthis: true */
  const vm = this;
  steps.complete();
  vm.save = function save(){

  };
}
