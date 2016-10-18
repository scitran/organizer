'use strict';
const angular = require('angular');
const app = angular.module('app');
const request = require('request');
const url = require('url');

app.factory('apiQueues', queues);
queues.$inject = ['queueFactory'];
function queues(queueFactory) {
  return {
    append: queueFactory.create(exec)
  };
}

function exec(message) {
  request(message.options, function(error, response, body){
    if (message.options.throwForStatus && response.statusCode >= 400) {
      let msg = '';
      try {
        msg = JSON.parse(body).message + '\n';
      } catch(e) {
        console.error(`Could not parse response from server: ${body}`);
      }
      message._reject(new Error(`${msg}HTTP Server responded with ${response.statusCode} for
${response.request.method} ${url.format(response.request.uri)}`));
    } else if (error){
      console.log(error);
      message._reject(error);
    } else {
      message._resolve(body);
    }
  });
}
