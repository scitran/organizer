'use strict';
const angular = require('angular');

const app = angular.module('app');
const Rx = require('rxjs/Rx');

app.factory('organizerStore', organizerStore);

organizerStore.$inject = [];

function organizerStore() {
  const state = {};
  const changed = new Rx.Subject();
  const service = {
    get: get,
    update: update,
    changed: changed
  };
  return service;

  function get() {
    return state;
  }
  function update(update) {
    Object.assign(state, update);
    changed.next({state: state, update: update});
    return state;
  }
}
