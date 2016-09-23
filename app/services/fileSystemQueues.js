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
function write(path, archive, resolve, reject, final) {
  const stream = archive.pipe(fs.createWriteStream(path));
  stream.on('finish', () =>{
    resolve();
    final();
  });
  stream.on('error', (error) => {
    reject(error);
    final();
  });
}

function exec(message, observable){
  const operation = message.options.operation;
  const path = message.options.path;
  const final = function() {
    observable.request(1);
  };
  if (operation === 'mkdir') {
    fs.mkdir(path, (error, data) => {
      if (error) {
        console.log(error);
        final();
        message.reject(error);
      } else {
        message.resolve(data);
        final();
      }
    });
  } else if (operation === 'write') {
    if (message.options.content_) {
      message.options.content_.then((archive) => {
        write(path, archive, message.resolve, message.reject, final);
      });
    } else if (message.options.content) {
      write(path, message.options.content, message.resolve, message.reject, final);
    } else {
      final();
      message.reject('content is missing on write operation');
    }
  } else if (operation === 'read') {
    fs.readFile(path, function(err, data) {
      if (err){
        console.log(err);
        final();
        message.reject(err);
      } else {
        message.resolve(data);
        final();
      }
    });
  } else if (!operation) {
    final();
    message.reject(`operation is missing`);
  } else {
    final();
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
        },
        (error) => {message.reject(error);o.request(1);}
      );
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
