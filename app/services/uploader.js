/*globals Buffer */
'use strict';
const angular = require('angular');
const archiver = require('archiver');
const {readFilePromise} = require('../common/util.js');

const app = angular.module('app');

app.factory('organizerUpload', organizerUpload);

organizerUpload.$inject = ['apiQueues'];

function organizerUpload(apiQueues) {
  const service = {
    upload: upload,
    createZipBuffer: createZipBuffer,
    testcall: testcall,
    loadGroups: loadGroups,
    loadProjects: loadProjects
  };
  return service;
  function testcall(instance) {
    var options = {
      url: `https://${instance}:8443/api`,
      agentOptions: {
        rejectUnauthorized: false
      }
    };
    return apiQueues.append({options: options});
  }
  function loadGroups(instance, apiKey, root){
    const options = {
      method: 'GET',
      url: `https://${instance}/api/groups?root=${root||false}`,
      headers: {
        'Authorization':  'scitran-user ' + apiKey
      },
      agentOptions: {
        rejectUnauthorized: false
      }
    };
    return apiQueues.append({options: options});
  }
  function loadProjects(instance, apiKey, group, root){
    const options = {
      method: 'GET',
      url: `https://${instance}/api/groups/${group}/projects?root=${root||false}`,
      headers: {
        'Authorization':  'scitran-user ' + apiKey
      },
      agentOptions: {
        rejectUnauthorized: false
      }
    };
    return apiQueues.append({options: options});
  }
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
  function upload(instance, files, metadata, apiKey, root) {
    var formData = {
      metadata: metadata
    };
    for (let i = 0; i < files.length; i++) {
      formData['file' + i] = {
        value: files[i].content,
        options: {
          filename: files[i].name
        }
      };
    }
    let message = {
      options: {
        method: 'POST',
        url: `https://${instance}/api/upload/label?root=${root||false}`,
        formData: formData,
        headers: {
          'Authorization':  'scitran-user ' + apiKey
        },
        agentOptions: {
          rejectUnauthorized: false
        }
      }
    };
    return apiQueues.append(message);
  }
}
