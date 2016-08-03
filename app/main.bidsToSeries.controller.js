'use strict';

const angular = require('angular');
const fs = require('fs');
const app = angular.module('app');

//const {humanReadableSize} = require('./common/uiformatters');

app.controller('sortedSeriesCtrl', sortedSeriesCtrl);

sortedSeriesCtrl.inject = ['$scope', 'organizerStore', 'organizerUpload'];

function sortedSeriesCtrl($scope, organizerStore, organizerUpload) {
  /*jshint validthis: true */
  const vm = this;
  organizerStore.changed.subscribe(
    (action) => {
      const update = action.update;
      if (typeof update.sortedSeries !== 'undefined') {
        Object.assign(vm, update.sortedSeries);
        vm.loaded = true;
        $scope.$apply();
      }
    }
  );
  vm.upload = function() {
    let series = organizerStore.get().sortedSeries;
    let promises = [];
    let metadata = null;
    let group = {_id: 'bids_group'};
    for (let p of series.projects) {
      let files = p.files.map(parseFile);
      let project = {
        label: p.label,
        files: files.map(fileMetadata)
      };
      let metadataBase = Object.assign({},
        {group: group},
        {project: project}
      );
      promises.push(organizerUpload.upload(
        vm.selectedInstance,
        files,
        JSON.stringify(metadataBase)
      ));
      delete project.files;
      for (let s of p.sessions) {
        let files = s.files.map(parseFile);
        let metadataSes = {
          session: {
            label: s.label,
            files: files.map(fileMetadata),
            subject: {
              code: s.subject.label
            }
          }
        };
        metadata = JSON.stringify(Object.assign({},
          {group: group},
          {project: {label: project.label}},
          metadataSes
        ));
        let promiseSes = organizerUpload.upload(
          vm.selectedInstance,
          files,
          metadata
        );
        promises.push(promiseSes);
        files = s.subject.files.map(parseFile);
        let metadataSub = {
          session:
            Object.assign({},
              metadataSes.session,
              {subject: {
                code: s.subject.label,
                files: files.map(fileMetadata)
              }}
            )
        };
        metadata = JSON.stringify(Object.assign({},
          metadataBase,
          metadataSub
        ));
        let promiseSub = organizerUpload.upload(
          vm.selectedInstance,
          files,
          metadata
        );
        promises.push(promiseSub);
        for (let a of s.acquisitions) {
          let files = a.files.map(parseFile);
          let metadataAcq = {
            acquisition: {
              label: a.label,
              files: files.map(fileMetadata)
            }
          };
          metadata = JSON.stringify(Object.assign({},
            {group: group},
            {project: {label: project.label}},
            {session: {
              label: metadataSes.session.label,
              subject: {code: s.subject.label}
            }},
            metadataAcq
          ));
          promises.push(organizerUpload.upload(
            vm.selectedInstance,
            files,
            metadata
          ));
        }
      }
    }
  };

  function parseFile(f) {
    return {
      name: f.path.split('/').pop(),
      content: fs.readFileSync(f.path)
    };
  }
  function fileMetadata(f) {
    return {
      name: f.name
    };
  }

}
