'use strict';
const angular = require('angular');
const app = angular.module('app');
const urlLibrary = require('url');

app.factory('apiQueues', queues);
queues.$inject = ['queueFactory'];
function queues(queueFactory) {
  return {
    append: queueFactory.create(exec)
  };
}

function exec(message) {
  const {
    options: {
      method,
      url
    }
  } = message;

  fetch(url, message.options).then(function(response) {
    return [response, response.text()];
  }).then(function([response, body]) {
    if (message.options.throwForStatus && !response.ok) {
      let msg = '';
      try {
        msg = JSON.parse(body).message + '\n';
      } catch(e) {
        console.error(`Could not parse response from server: ${body}`);
      }
      message._reject(new Error(`${msg}HTTP Server responded with ${response.status} for
${method} ${urlLibrary.format(url)}`));
    } else {
      message._resolve(body);
    }
  }).catch(function(error) {
    console.log(error);
    message._reject(error);
  })
}
