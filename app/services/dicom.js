'use strict';
const angular = require('angular');

const app = angular.module('app');

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const Rx = require('rx');
const {dirListObs} = require('../common/util.js');
const dicomParser = require('dicom-parser');
const nifti = require('nifti-js');
const TAG_DICT = require('../common/dataDictionary.js').TAG_DICT;
const crypto = require('crypto');
const filetypes = require('../common/filetypes.json');

const extToScitranType = {};
for (const type of Object.keys(filetypes)) {
  for (const ext of filetypes[type]) {
    extToScitranType[ext] = type;
  }
}

const decompressForExt = {
  '.gz': function gunzip(buffer) {
    return zlib.gunzipSync(buffer);
  }
};

function dicom($rootScope, organizerStore, fileSystemQueues) {
  const parseHeadersForExt = {
    '.nii': function(buffer) {
      // TODO write a function that converts this into proper headers.
      return nifti.parseNIfTIHeader(buffer);
    },
    '.dcm': function(buffer) {
      return convertHeaderToObject(dicomParser.parseDicom(buffer));
    }
  };

  const parseFileHeaders = (buffer, filePath, ext) => {
    // we pass ext in because we may have decompressed the file content earlier.
    const parseHeaders = parseHeadersForExt[ext];
    if (!parseHeaders) {
      throw new Error(`Could not parse headers for file ${filePath} with extension ${ext}.`);
    }
    return parseHeaders(buffer, filePath);
  };

  const parseFile = (filePath) => {
    return fileSystemQueues.append({
      operation: 'read',
      path: filePath
    }).then(
      function(buffer) {
        let ext = path.extname(filePath);
        // we compute hash before unzipping because that's what we will upload.
        const hash = 'v0-sha384-' + crypto.createHash('sha384').update(buffer).digest('hex');
        if (decompressForExt[ext]) {
          buffer = decompressForExt[ext](buffer);
          // now let's see what's after the compression extension
          ext = path.extname(filePath.slice(0, filePath.length - ext.length));
        }
        const size = buffer.length * buffer.BYTES_PER_ELEMENT;
        const header = parseFileHeaders(buffer, filePath, ext);
        const type = extToScitranType[ext];
        if (!type) {
          throw new Error(`Invalid extension ${ext} for file ${filePath}`);
        }
        return {
          path: filePath,
          contentExt: ext,
          content: buffer,
          size,
          hash,
          type,
          header
        };
      }
    );
  };

  const getTag = (key) => {
    const group = key.substring(1,5);
    const element = key.substring(5,9);
    const tagIndex = ('(' + group + ',' + element + ')').toUpperCase();
    return TAG_DICT[tagIndex];
  };

  const dicomDump = (filePath) => {
    const header = parseFile(filePath).header;
    let dump = [];
    for (let key of Object.keys(header)) {
      dump.push(`${key}: ${header[key]}`);
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
    console.log(count);
    const increment = 100.0/count;
    const progress = organizerStore.get().progress;
    return files.flatMap(
      (f) => {
        return parseFile(f).catch(
          function(err) {
            return {
              path: f,
              err: err
            };
          }
        );
      }
    )
    .map(
      (o) => {
        progress.state += increment;
        $rootScope.$apply();
        return o;
      }
    )
    .doOnCompleted(() => {
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
    const dicoms = [];
    const errors = [];
    obsFiles$.subscribe(
      function(elem) {
        if (elem.err) {
          errors.push(elem);
        } else {
          count += 1;
        }
      },
      function(err) { throw err;},
      function() {
        console.log(count);
        const dicoms$ = parseDicoms(
          obsFiles$.filter(elem => !elem.err).map(elem => elem.path),
          count
        );

        const start = Date.now();

        dicoms$.subscribe(
          function(dicom) {
            if (dicom.err){
              errors.push(dicom);
            } else {
              dicoms.push(dicom);
            }
          },
          function (err) {
            subject.onError(err);
            console.log('Error: ' + err);
          },
          function () {
            subject.onNext({message: `Processed ${dicoms.length} files in ${(Date.now() - start)/1000} seconds`});
            if (errors.length) {
              subject.onNext({errors: errors});
            }
            console.log(dicoms.length);
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

dicom.$inject = ['$rootScope', 'organizerStore', 'fileSystemQueues'];
app.factory('dicom', dicom);
