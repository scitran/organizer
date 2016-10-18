'use strict';
const fs = require('fs');
const path = require('path');
const angular = require('angular');
const {remote} = require('electron');

angular.module('app').factory('config', config);

config.$inject = [];

const configPath = path.join(remote.process.env.USER_DATA_PATH, 'user.json');
console.log('Config path:', configPath);

function config() {
  let config;

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath));
    } catch (e) {
      console.error(`Error when loading config: ${e.stack}`);
    }
  }
  if (!config) {
    config = {};
  }

  // implements some methods from the Storage Web API
  return {
    getItem(key) {
      return config[key];
    },

    setItem(key, value) {
      config[key] = value;
      return new Promise(function(resolve) {
        // Running writing to file async. We don't really care if it fails.
        fs.writeFile(
          configPath,
          JSON.stringify(config, null, 2),
          // We write the file in a restricted way so we can potentially add
          // credentials to it later.
          {mode: '600'},
          resolve
        );
      });
    }
  };
}
