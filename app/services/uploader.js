'use strict';
const angular = require('angular');
const app = angular.module('app');

app.factory('organizerUpload', organizerUpload);

organizerUpload.$inject = ['apiQueues'];

function organizerUpload(apiQueues) {
  function _request(options) {
    let url = options.url;
    if (url[0] === '/' && options.instance) {
      url = `https://${options.instance}/api${options.url}`;
    }
    return apiQueues.append({
      options: Object.assign({}, options, {
        url,
        headers: Object.assign({
          'Authorization':  'scitran-user ' + options.apiKey
        }, options.headers),
        agentOptions: Object.assign({
          rejectUnauthorized: false
        }, options.agentOptions)
      })
    });
  }

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
    return _request({
      method: 'GET',
      instance,
      apiKey,
      url: `/groups?root=${root||false}`
    });
  }
  function loadProjects(instance, apiKey, group, root){
    return _request({
      method: 'GET',
      instance,
      apiKey,
      url: `/groups/${group}/projects?root=${root||false}`
    });
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
    return _request({
      method: 'POST',
      instance,
      apiKey,
      url: `/upload/label?root=${root||false}`,
      throwForStatus: true,
      formData: formData
    });
  }
}
