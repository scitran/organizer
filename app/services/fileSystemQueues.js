'use strict';
const angular = require('angular');
const app = angular.module('app');
const fs = require('fs');

app.factory('fileSystemQueues', queues);

queues.$inject = ['queueFactory'];

function queues(queueFactory) {
  return {
    append: queueFactory.create(exec)
  };
}

function write(path, archive, resolve, reject) {
  const stream = archive.pipe(fs.createWriteStream(path));
  stream.on('finish', () =>{
    resolve();
  });
  stream.on('error', (error) => {
    reject(error);
  });
}

function exec(message){
  const operation = message.operation;
  const path = message.path;
  if (operation === 'mkdir') {
    fs.mkdir(path, (error, data) => {
      if (error) {
        console.log(error);
        message._reject(error);
      } else {
        message._resolve(data);
      }
    });
  } else if (operation === 'write') {
    if (message.content) {
      write(path, message.content, message._resolve, message._reject);
    } else {
      message._reject('content is missing on write operation');
    }
  } else if (operation === 'read') {
    fs.readFile(path, function(err, data) {
      if (err){
        console.log(err);
        message._reject(err);
      } else {
        message._resolve(data);
      }
    });
  } else if (!operation) {
    message._reject(`operation is missing`);
  } else {
    message._reject(`operation ${operation} not implemented`);
  }
}
