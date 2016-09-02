'use strict';
const angular = require('angular');
const app = angular.module('app');
const Rx = require('rx');
const fs = require('fs');

app.factory('fileSystemQueues', queues);

// function write(path, buffer, resolve, reject) {
//   return fs.open(path, 'w', (error, fd) => {
//     if (error) {
//       reject(error);
//     } else {
//       fs.write(fd, buffer, (error, data) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(data);
//         }
//       });
//
//     }
//   });
// }
function write(path, archive, resolve, reject) {
  const stream = archive.pipe(fs.createWriteStream(path));
  stream.on('finish', () =>{
    resolve();
  });
  stream.on('error', (error) => {
    reject(error);
  });
}

function exec(message, observable){
  const operation = message.options.operation;
  const path = message.options.path;
  if (operation === 'mkdir') {
    fs.mkdir(path, (error, data) => {
      if (error) {
        console.log(error);
        message.reject(error);
      } else {
        message.resolve(data);
        observable.request(1);
      }
    });
  } else if (operation === 'write') {
    if (message.options.content_) {
      message.options.content_.then((archive) => {
        write(path, archive, message.resolve, message.reject);
      });
    } else if (message.options.content) {
      write(path, message.options.content, message.resolve, message.reject);
    } else {
      message.reject('content is missing on write operation');
    }
  } else if (!operation) {
    message.reject(`operation is missing`);
  } else {
    message.reject(`operation ${operation} not implemented`);
  }
}

function queues() {
  let q = new Rx.Subject();
  let o = q.controlled();
  o.request(6);
  o.subscribe(
    function(message) {
      if (message.options.waitFor) {
        message.options.waitFor.then(() => {
          exec(message, o);
        });
      } else {
        exec(message, o);
      }
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
        Object.assign({}, {options: message}, {resolve: resolve, reject: reject})
      );
    });
  }
}
