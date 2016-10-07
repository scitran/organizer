'use strict';
const angular = require('angular');
const app = angular.module('app');

app.factory('organizerUpload', organizerUpload);

organizerUpload.$inject = ['apiQueues'];

function organizerUpload(apiQueues) {
  const service = {
    upload: upload,
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
