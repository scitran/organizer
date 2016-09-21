'use strict';
const angular = require('angular');

const app = angular.module('app');

const fs = require('fs');
const Rx = require('rx');
const {dirListObs} = require('../common/util.js');
const dicomParser = require('dicom-parser');
const TAG_DICT = require('../common/dataDictionary.js').TAG_DICT;

function dicom($rootScope, organizerStore) {
  console.log(organizerStore);
  const parse = (filePath) => {
    const dicomFileAsBuffer = fs.readFileSync(filePath);
    const size = dicomFileAsBuffer.length * dicomFileAsBuffer.BYTES_PER_ELEMENT;
    return {
      dp: dicomParser.parseDicom(dicomFileAsBuffer),
      size: size
    };
  };

  const getTag = (key) => {
    const group = key.substring(1,5);
    const element = key.substring(5,9);
    const tagIndex = ('(' + group + ',' + element + ')').toUpperCase();
    return TAG_DICT[tagIndex];
  };

  const dicomDump = (filePath) => {
    const dp = parse(filePath).dp;
    let dump = [];
    for (let key of Object.keys(dp.elements)) {
      let tag = getTag(key);
      let value = dp.string(key);
      let line = (tag && (tag.name + ': ' + value)) || (key + ': ' + value);
      dump.push(line);
    }
    return dump;
  };

  const convertHeaderToObject = (header) => {
    let m = Object.create(null);
    for (let key of Object.keys(header.elements)) {
      let tag = getTag(key);
      let value = header.string(key);
      if (tag) {
        m[tag.name] = value;
      } else {
        m[key] = value;
      }
    }
    return m;
  };

  const parseDicoms = (files, count) => {
    const increment = 100.0/count;
    const progress = organizerStore.get().progress;
    const loaded = organizerStore.get().loaded;
    return files.map(
      (f) => {
        try {
          const parsed = parse(f);
          loaded.size += parsed.size;
          return {
            path: f,
            size: parsed.size,
            header: convertHeaderToObject(parsed.dp)
          };
        } catch (exc) {
          return {name: f};
        }

      }
    ).filter(
      (o) => {
        progress.state += increment;
        $rootScope.$apply();
        return o.header !== undefined;
      }
    ).doOnCompleted(() => {
      progress.state = 0;
      $rootScope.$apply();
    });
  };

  const sortDicoms = function(path) {
    const subject = new Rx.Subject();
    try {
      fs.accessSync(path);
    } catch (exc) {
      subject.onError(path + ' is not accessible on the filesystem.');
    }
    const obsFiles$ = dirListObs(path);
    let count = 0;
    obsFiles$.subscribe(
      function() {
        count += 1;
      },
      function(err) { throw err;},
      function() {
        console.log(count);
        const dicoms$ = parseDicoms(obsFiles$, count);

        const start = Date.now();
        const dicoms = [];

        dicoms$.subscribe(
          function(dicom) {
            dicoms.push(dicom);
          },
          function (err) {
            subject.onError(err);
            console.log('Error: ' + err);
          },
          function () {
            subject.onNext({message: `Processed ${dicoms.length} files in ${(Date.now() - start)/1000} seconds`});
            subject.onNext(dicoms);
            subject.onCompleted();
          }
        );
      }
    );

    return subject;
  };

  return {
    dicomDump: dicomDump,
    parseDicoms: parseDicoms,
    sortDicoms: sortDicoms
  };
}

dicom.$inject = ['$rootScope', 'organizerStore'];
app.factory('dicom', dicom);
