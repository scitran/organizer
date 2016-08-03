'use strict';
const angular = require('angular');

const app = angular.module('app');

//const fs = require('fs');
//const Rx = require('rxjs/Rx');
const {dirListObsNew} = require('../common/util.js');
const {mapBidsFolderToSeries} = require('../common/uiformatters.js');

function bidsToSeries(path) {
  const files = dirListObsNew(path);
  return mapBidsFolderToSeries(files);
}

module.exports = {
  bidsToSeries: bidsToSeries
};

function bids() {
  return module.exports;
}
bids.$inject = [];
app.factory('bids', bids);
