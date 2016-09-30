'use strict';
const fs = require('fs');
const Rx = require('rx');

const dirListObs = function(path) {
  const _helperObs = elem =>
    Rx.Observable.create(function(observer){
      if (elem.isFolder) {
        fs.readdir(elem.path, (err, files) => {
          const p = Promise.resolve();
          const final = files.reduce((p, f) => {
            const path = elem.path + '/' + f;
            return p.then(function() {
              return new Promise(function(resolve) {
                fs.stat(path, (err, stat) => {
                  if (err){
                    observer.next({
                      path: path,
                      err: err
                    });
                  } else {
                    observer.next({
                      path: path,
                      isFolder: stat.isDirectory(),
                      parent: elem.path
                    });
                  }
                  resolve();
                });
              });
            });
          }, p);
          final.then(function(){
            observer.onCompleted();
          });
        });
      } else {
        observer.onCompleted();
      }
    });
  return Rx.Observable
    .of({path:path, isFolder:true, parent: ''})
    .expand(_helperObs)
    .filter(elem => {
      return !elem.isFolder;
    });
};

function readFilePromise(f) {
  return new Promise(function(resolve, reject){
    fs.readFile(f, function(err, data){
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports = {
  dirListObs: dirListObs,
  readFilePromise: readFilePromise
};
