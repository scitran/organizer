'use strict';
const angular = require('angular');

const app = angular.module('app');
//const Rx = require('rxjs/Rx');
const AdmZip = require('adm-zip');
const request = require('request');

app.factory('organizerUpload', organizerUpload);

organizerUpload.$inject = [];

function organizerUpload() {
  const service = {
    upload: upload,
    createZipBuffer: createZipBuffer
  };
  return service;
  function createZipBuffer(files, comment) {
    const zip = new AdmZip();
    for (let f of files) {
      zip.addLocalFile(f);
    }
    zip.comment = comment;
    return zip.toBuffer();
  }
  function upload(instance, name, zip, metadata) {
    var formData = {
      metadata: metadata,
      file: {
        value: zip,
        options: {
          filename: name
        }
      }
    };
    var options = {
      url: 'https://${instance}:8443/api/upload/label',
      formData: formData,
      headers: {
        'X-SciTran-Auth':  'change-me',
        'X-Scitran-Name':  'SciTran-Drone-Reaper',
        'X-Scitran-Method':'label-upload'
      },
      agentOptions: {
        rejectUnauthorized: false
      }
    };
    return request.post(options);
  }
}
