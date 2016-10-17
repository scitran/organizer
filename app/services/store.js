'use strict';
const angular = require('angular');

const app = angular.module('app');
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
    },
    busy: {
      state: false
    },
    fileErrors: {}
  };
  const service = {
    get: get,
    update: update
  };
  return service;

  function get() {
    return state;
  }
  function update(update) {
    if (typeof update.dicoms !== 'undefined') {
      update.seriesDicoms = mapToSeriesRow(update.dicoms);
      update.rawDicoms = true;
    }
    Object.assign(state, update);
    return state;
  }

}
