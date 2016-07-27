'use strict';
const fs = require('fs');
const Rx = require('rxjs/Rx');

const dirListObs = function(path) {
  const _helperObs = path =>
    Rx.Observable.create(function(observer){
      fs.stat(path, (err, stat) => {
        if (stat.isDirectory()) {
          fs.readdir(path, (err, files) => {
            files.forEach(f => observer.next(path + '/' + f));
            observer.complete();
          });
        } else {
          observer.complete();
        }

      });
    });
  return Rx.Observable
    .of(path)
    .expand(_helperObs);
};

module.exports = {
  dirListObs: dirListObs
};
