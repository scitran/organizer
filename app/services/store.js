'use strict';
const angular = require('angular');

const app = angular.module('app');
const Rx = require('rxjs/Rx');
const {mapToSeriesRow} = require('../common/uiformatters');

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
  changed.subscribe(
    (action) => {
      //jshint unused:false
      if (typeof action.update.dicoms !== 'undefined'){
        update({
          seriesDicoms: mapToSeriesRow(action.update.dicoms)
        });
      }
    }
  );
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
