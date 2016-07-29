/*globals Buffer */
'use strict';
const angular = require('angular');
const fs = require('fs');
const archiver = require('archiver');

const app = angular.module('app');
//const Rx = require('rxjs/Rx');
const request = require('request');

app.factory('organizerUpload', organizerUpload);

organizerUpload.$inject = [];

function organizerUpload() {
  const service = {
    upload: upload,
    createZipBuffer: createZipBuffer
  };
  return service;

  function createZipBuffer(files) {
    var promise = new Promise(function(resolve, reject){
      let archive = archiver.create('zip', {});
      let bufs = [];
      archive.on('data', function(data){
        bufs.push(data);
      });
      archive.on('end', function() {
        resolve(Buffer.concat(bufs));
        console.log('zip process completed');
      });
      archive.on('error', function(err) {
        console.log('error during zip process: ' + err);
        reject('error during zip process: ' + err);
      });
      var p = new Promise(function(resolve){
        resolve(archive);
      });
      files.reduce(function(p, f) {
        return p.then(function(archive){
          return readFilePromise(f).then(function(rs){
            return archive.append(rs, {name: f.split('/').pop()});
          });
        });
      }, p).then(function(archive){
        archive.finalize();
      });
    });
    return promise;
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
      url: `https://${instance}:8443/api/upload/label`,
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
    return request.post(options, function(error, response, body){
      if (error){
        console.log(error);
        return;
      }
      console.log(body);
    });
  }
}

function readFilePromise(f) {
  return new Promise(function(resolve, reject){
    fs.readFile(f, function(err, data){
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
