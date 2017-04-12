'use strict';
const angular = require('angular');
const app = angular.module('app');
const urlLibrary = require('url');
const {fetch} = require('../common/fetch');

app.factory('apiQueues', queues);
queues.$inject = ['queueFactory'];
function queues(queueFactory) {
  return {
    append: queueFactory.create(exec)
  };
}

function baseFetch(message) {
  const {
    options: {
      method,
      url
    }
  } = message;

  return fetch(url, message.options).then(function(response) {
    return Promise.all([response, response.text()]);
  }).then(function([response, body]) {
    if (message.options.throwForStatus && !response.ok) {
      let msg = '';
      try {
        msg = JSON.parse(body).message + '\n';
      } catch(e) {
        console.error(`Could not parse response from server: ${body}`);
      }
      throw new Error(`${msg}HTTP Server responded with ${response.status} for
${method} ${urlLibrary.format(url)}`);
    } else {
      return body;
    }
  }).catch(function(error) {
    console.log(error);
    throw error;
  });
}

exports.baseFetch = baseFetch;

function exec(message) {
  baseFetch(message).then(function(result) {
    message._resolve(result);
  }).catch(function(error) {
    message._reject(error);
  });
}
