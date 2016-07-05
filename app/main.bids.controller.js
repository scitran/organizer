'use strict';

const angular = require('angular');
const app = angular.module('app');
const {humanReadableSize} = require('./uiformatters');

app.controller('bidsCtrl', bidsCtrl);

bidsCtrl.$inject = ['$scope', 'organizerStore'];

function bidsCtrl($scope, organizerStore) {
  /*jshint validthis: true */
  const vm = this;
  vm.humanReadableSize = humanReadableSize;
  updateTable(organizerStore.get().seriesDicoms);

  organizerStore.changed.subscribe(
    (action) => {
      const update = action.update;
      if (typeof update.seriesDicoms !== 'undefined') {
        updateTable(update.seriesDicoms);
        $scope.$apply();
      }
    }
  );

  function updateTable(bidsDicoms) {
    let seriesMap = new Map();
    vm.dicoms = [];
    (bidsDicoms||[]).forEach((dicom) => {
      const header = dicom.header;
      const series = [
        header.SeriesDescription,
        header.PixelSpacing,
        header.AcquisitionMatrix,
        header.EchoTime,
        header.RepetitionTime,
        header.FlipAngle
      ];
      const seriesHash = series.join();
      const seriesObj = seriesMap.get(seriesHash) || {series: series, size:0, count:0};
      seriesObj.count += 1;
      seriesObj.size += dicom.size;
      seriesMap.set(seriesHash, seriesObj);
    });
    for (let k of seriesMap.keys()) {
      const seriesObj = seriesMap.get(k);
      const series = seriesObj.series;
      series.push(humanReadableSize(seriesObj.size));
      series.push(seriesObj.count);
      vm.dicoms.push(series);
    }
  }
}
