'use strict';
const angular = require('angular');
const app = angular.module('app');
const Rx = require('rx');
const request = require('request');

app.factory('apiQueues', queues);

function queues() {
  let q = new Rx.Subject();
  let o = q.controlled();
  o.request(6);
  o.subscribe(
    function(message) {
      request(message.options, function(error, response, body){
        if (error){
          console.log(error);
          message.reject(error);
        } else {
          message.resolve(body);
          o.request(1);
        }
      });
    },
    function(error) {
      console.log(error);
    },
    function() {
      console.log('queue has been closed');
    }
  );
  let service = {
    append: append
  };
  return service;

  function append(message) {
    return new Promise(function(resolve, reject){
      q.onNext(
        Object.assign({}, message, {resolve: resolve, reject: reject})
      );
    });
  }
}
