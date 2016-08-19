'use strict';

const angular = require('angular');
const app = angular.module('app');

app.filter('objLength', function() {
  return function(object) {
    return Object.keys(object).length;
  };
});
