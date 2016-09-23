'use strict';
const angular = require('angular');

const app = angular.module('app');
const Rx = require('rx');
const {mapToSeriesRow} = require('../common/uiformatters');

app.factory('organizerStore', organizerStore);

organizerStore.$inject = [];

function organizerStore() {
  const state = {
    progress: {
      state: 0
    },
    loaded: {
      size: 0
    },
    success: {
      state: ''
    }
  };
  const changed = new Rx.Subject();
  const service = {
    get: get,
    update: update,
    changed: changed
  };
  changed.subscribe(
    (action) => {
      if (typeof action.update.dicoms !== 'undefined') {
        update({
          seriesDicoms: mapToSeriesRow(action.update.dicoms),
          rawDicoms: true
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
    changed.onNext({state: state, update: update});
    return state;
  }

}
