'use strict';
const angular = require('angular');
const app = angular.module('app');
const {readFilePromise} = require('../common/util.js');
const archiver = require('archiver');

function projectsService($rootScope, organizerStore, fileSystemQueues) {
  return {
    save: save
  };
  function createZip(files) {
    var promise = new Promise(function(resolve){
      let archive = archiver.create('zip', {});
      archive.on('end', function() {
        console.log('zip process completed');
      });
      var p = new Promise(function(resolve){
        resolve(archive);
      });
      files.reduce(function(p, f) {
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
    return promise;
  }
  function save(projects, path){
    const allPromises = [];
    const progress = organizerStore.get().progress;
    const busy = organizerStore.get().busy;
    busy.state = true;
    $rootScope.$apply();
    const increment = 100.0/organizerStore.get().loaded.size;
    projects.forEach((p) => {
      if (p.state !== 'checked' && p.state !== 'indeterminate'){
        return;
      }
      const projectPath = path + '/' + p.label;
      const projectDir_ = fileSystemQueues.append({
        operation: 'mkdir',
        path: projectPath
      });
      allPromises.push(projectDir_);
      Object.keys(p.children).forEach((sessionUID) => {
        const sessionPath = projectPath + '/' + sessionUID;
        const session = p.children[sessionUID];
        if (session.state !== 'checked' && session.state !== 'indeterminate'){
          return;
        }
        const sessionDir_ = fileSystemQueues.append({
          operation: 'mkdir',
          path: sessionPath,
          waitFor: projectDir_
        });
        allPromises.push(sessionDir_);
        Object.keys(session.children).forEach((acquisitionLabel) => {
          const acqPath = sessionPath + '/' + acquisitionLabel;
          const acquisition = session.children[acquisitionLabel];
          if (acquisition.state !== 'checked' && acquisition.state !== 'indeterminate'){
            return;
          }
          const acqDir_ = fileSystemQueues.append({
            operation: 'mkdir',
            path: acqPath,
            waitFor: sessionDir_
          });
          const archivePromise = createZip(acquisition.filepaths);
          const zipPath = acqPath + '/' + acquisition.acquisitionUID + '.zip';
          allPromises.push(fileSystemQueues.append({
            operation: 'write',
            path: zipPath,
            content_: archivePromise,
            waitFor: acqDir_
          }).then(function(result){
            progress.state += acquisition.size*increment;
            $rootScope.$apply();
            return result
          }));
        });
      });
    });
    return Promise.all(allPromises).then(function(results){
      progress.state = 0;
      busy.state = false;
      $rootScope.$apply();
      return results;
    });
  }
}
projectsService.$inject = ['$rootScope', 'organizerStore', 'fileSystemQueues'];
app.factory('projectsService', projectsService);
