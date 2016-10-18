const ipc = require('electron').ipcRenderer;

exports.ipcPromiseCreator = function ipcPromiseCreator(message, response) {
  function creator(arg) {
    ipc.send(message, arg);
    return new Promise(function(resolve) {
      ipc.once(response, function (event, result) {
        resolve(result);
      });
    });
  }
  return creator;
};
