'use strict';

const fs = require('fs');
const {dicomDump, dicomSort} = require('./dicom.js');
const Rx = require('rxjs/Rx');
const DicomTable = require('./components/DicomTable');
const React = require('react');
const ReactDOM = require('react-dom');
const ipc = require('electron').ipcRenderer;

const selectDirBtn = document.getElementById('select-directory');

selectDirBtn.addEventListener('click', function () {
  ipc.send('open-file-dialog');
});


const createAndAppendDIV = (parent, content) => {
  let div = document.createElement('div');
  div.innerHTML = content;
  parent.appendChild(div);
  return div;
};

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

const appendDicomSort = function(path) {
  try {
    fs.accessSync(path);
  } catch (exc) {
    document.getElementById('selected-directory').innerHTML = path + ' is not accessible on the filesystem.'
  }
  //const view = new View(doc, '&nbsp;&nbsp;&nbsp;');
  const dicoms = [];
  const obsFiles = dirListObs(path);
  const subject = new Rx.Subject();
  const start = Date.now();
  dicomSort(obsFiles).subscribe(
    function(dicom) {
      dicoms.push(dicom);
    },
    function (err) {
      subject.error(err);
      console.log('Error: ' + err);
    },
    function () {
      subject.next(dicoms);
      document.getElementById('statistics').innerHTML = `Processed ${dicoms.length} files in ${(Date.now() - start)/1000} seconds`;
      subject.complete();
    }
  );
  return subject;
};

ipc.on('selected-directory', function (event, path) {
  document.getElementById('selected-directory').innerHTML = `You selected: ${path}`;
  const subject = appendDicomSort(path[0]);
  subject.subscribe(
    (dicoms) =>
      ReactDOM.render(<DicomTable dicoms={dicoms}/>, document.getElementsByClassName('dicom-sort')[0])
  );
});

const appendDicomDump = function(path) {
  let doc = document.getElementsByClassName('dicom-dump')[0];
  doc.innerHTML = '';
  dicomDump(path).forEach(
    (line) => createAndAppendDIV(doc, line)
  );
  return false;
};

window.renderer = {
  appendDicomDump: appendDicomDump,
  appendDicomSort: appendDicomSort
};
