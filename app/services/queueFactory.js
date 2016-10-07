'use strict';
const angular = require('angular');
const app = angular.module('app');
const Rx = require('rx');

app.factory('queueFactory', queueFactory);

function queueFactory() {
  const service = {
    create: create
  };
  return service;

  function create(exec, n) {
    if (typeof n === 'undefined') {
      n = 6;
    }
    const queue = new Rx.Subject();
    const consumer = queue.controlled();
    consumer.request(n);
    consumer.subscribe(
      function(message) {
        if (typeof message.waitFor !== 'undefined') {
          message.waitFor.then((content) => {
            message.content = content;
            exec(message);
          },
          (error) => {message._reject(error);}
        );
        } else {
          exec(message);
        }
      },
      function(error) {
        console.log(error);
      },
      function() {
        console.log('queue has been closed');
      }
    );
    return append;
    function append(message) {
      return new Promise(function(resolve, reject){
        function wrapResolve(data){
          resolve(data);
          consumer.request(1);
        }
        function wrapReject(err){
          reject(err);
          consumer.request(1);
        }
        queue.onNext(
          Object.assign({}, message, {_resolve: wrapResolve, _reject: wrapReject})
        );
      });
    }
  }
}
