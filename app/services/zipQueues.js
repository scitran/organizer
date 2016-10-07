/*globals Buffer */
'use strict';
const angular = require('angular');
const app = angular.module('app');
const {readFilePromise} = require('../common/util.js');
const archiver = require('archiver');

app.factory('zipQueues', queues);
queues.$inject = ['queueFactory'];
function queues(queueFactory) {
  return {
    append: queueFactory.create(exec)
  };
}

function exec(message){
  let promise = null;
  if (message.store) {
    promise = new Promise(function(resolve){
      const archive = archiver.create('zip', {});
      archive.on('end', function() {
        console.log('zip process completed');
      });
      const p = new Promise(function(resolve){
        resolve(archive);
      });
      message.files.reduce(function(p, f) {
        return p.then(function(archive){
          return readFilePromise(f).then(function(rs){
            return archive.append(rs, {name: f.split('/').pop()});
          });
        });
      }, p).then(function(archive){
        archive.finalize();
        resolve(archive);
      });
    });
  } else {
    promise = new Promise(function(resolve, reject){
      const archive = archiver.create('zip', {});
      const bufs = [];
      archive.on('data', function(data){
        bufs.push(data);
      });
      archive.on('end', function() {
        resolve(Buffer.concat(bufs));
        console.log('zip process completed');
      });
      archive.on('error', function(err) {
        console.log('error during zip process: ' + err);
        reject('error during zip process: ' + err);
      });
      const p = new Promise(function(resolve){
        resolve(archive);
      });
      message.files.reduce(function(p, f) {
        return p.then(function(archive){
          return readFilePromise(f).then(function(rs){
            return archive.append(rs, {name: f.split('/').pop()});
          });
        });
      }, p).then(function(archive){
        archive.finalize();
      });
    });
  }
  promise.then(function(archive) {
    message._resolve(archive);
  });
}
