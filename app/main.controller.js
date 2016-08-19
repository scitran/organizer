'use strict';

const angular = require('angular');
const app = angular.module('app');

app.controller('mainCtrl', mainCtrl);

mainCtrl.$inject = ['$state'];

function mainCtrl($state){
  /*jshint validthis: true */
  $state.go('main.load');
}
