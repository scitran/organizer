/* global __dirname, process */
'use strict';

// handles standard squirrel events for windows (which are required)
if (require('electron-squirrel-startup')) return;

const {app, BrowserWindow, Menu} = require('electron');
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
// On OS X this command line switch is helpful, particularly with hot
// reloading. However, this seems to prevent the app from starting on
// windows.
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('js-flags','--max_old_space_size=4096');
}

if (process.argv.indexOf('--ignore-certificate-errors') !== -1) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

process.env.USER_DATA_PATH = app.getPath('userData');

ipc.on('open-file-dialog', function (event, arg) {
  const window = BrowserWindow.fromWebContents(event.sender);
  dialog.showOpenDialog(
    window,
    { properties: [ 'openDirectory' ]},
    function (files) {
      const channel = (arg === 'main.bids-to-series')?'selected-bids-directory':'selected-directory';
      if (files) event.sender.send(channel, files);
    }
  );
});
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1600, height: 900});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  var template = [{
    label: 'Application',
    submenu: [
      { label: 'About Application', selector: 'orderFrontStandardAboutPanel:' },
      { type: 'separator' },
      { label: 'Refresh', accelerator: 'Command+R', click: function() {mainWindow.loadURL('file://' + __dirname + '/index.html');}},
      { label: 'Developer Tools', accelerator: 'Alt+Command+J', click: function() {mainWindow.webContents.openDevTools();}},
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', click: function() { app.quit(); }}
    ]},
    {label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
