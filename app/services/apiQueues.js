'use strict';
const angular = require('angular');
const app = angular.module('app');
const request = require('request');

app.factory('apiQueues', queues);
queues.$inject = ['queueFactory'];
function queues(queueFactory) {
  return {
    append: queueFactory.create(exec)
  };
}

function exec(message) {
  request(message.options, function(error, response, body){
    if (error){
      console.log(error);
      message._reject(error);
    } else {
      message._resolve(body);
    }
  });
}
