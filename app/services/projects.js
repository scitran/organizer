'use strict';
const angular = require('angular');
const app = angular.module('app');

function projectsService($rootScope, organizerStore, fileSystemQueues, zipQueues) {
  return {
    save: save
  };
  function save(projects, path){
    const allPromises = [];
    const progress = organizerStore.get().progress;
    const busy = organizerStore.get().busy;
    busy.state = true;
    busy.reason = 'Saving data...';
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
          const archivePromise = acqDir_.then(
            function(){
              return zipQueues.append({files: acquisition.filepaths, store: true});
            }
          );
          const zipPath = acqPath + '/' + acquisition.acquisitionUID + '.zip';
          allPromises.push(fileSystemQueues.append({
            operation: 'write',
            path: zipPath,
            waitFor: archivePromise
          }).then(function(result){
            progress.state += acquisition.size*increment;
            $rootScope.$apply();
            return result;
          }));
        });
      });
    });
    return Promise.all(allPromises).then(function(results){
      progress.state = 0;
      busy.state = false;
      busy.reason = '';
      $rootScope.$apply();
      return results;
    });
  }
}
projectsService.$inject = ['$rootScope', 'organizerStore', 'fileSystemQueues', 'zipQueues'];
app.factory('projectsService', projectsService);
