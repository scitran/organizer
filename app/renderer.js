'use strict';

const fs = require('fs');
const {dicomDump, dicomSort} = require('./dicom.js');
const Rx = require('rxjs/Rx');

const createAndAppendDIV = (parent, content) => {
  let div = document.createElement('div');
  div.innerHTML = content;
  parent.appendChild(div);
  return div;
};

// const createAndAppendDicomLink = (parent, indent, content, fPath) => {
//   let element = document.createElement('div');
//   element.innerHTML = indent;
//   let a = document.createElement('a');
//   a.onclick = function(){return window.renderer.appendDicomDump(fPath);};
//   a.setAttribute('href', '#');
//   a.innerHTML = content;
//   element.appendChild(a);
//   parent.appendChild(element);
// };

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

class View {
  constructor(root, indent) {
    this.root = root;
    this.sessions = new Map();
    this.indent = indent;
  }

  appendDicom(dicom) {
    if (!this.sessions.has(dicom.sessionUID)) {
      this.sessions.set(
        dicom.sessionUID,
        {
          acqMap: new Map(),
          sesDiv: createAndAppendDIV(this.root, dicom.sessionUID)
        }
      );
    }
    let {sesDiv, acqMap} = this.sessions.get(dicom.sessionUID);
    if (!acqMap.has(dicom.acquisitionUID)) {
      acqMap.set(
        dicom.acquisitionUID,
        {
          acqDiv: createAndAppendDIV(sesDiv, this.indent + dicom.acquisitionLabel),
          count: 0
        }
      );
    }
    let acquisition = acqMap.get(dicom.acquisitionUID);
    acquisition.count += 1;
    acquisition.acqDiv.innerHTML = (
      this.indent + dicom.acquisitionLabel + ' (' + acquisition.count + ' files)');
    // let fsplit = dicom.name.split('/');
    // let fname = fsplit[fsplit.length - 1];
    // createAndAppendDicomLink(
    //   acqDiv, this.indent + this.indent, fname, dicom.name
    // );
  }
}

const appendDicomSort = function(path) {
  document.getElementsByClassName('dicom-dump')[0].innerHTML = '';
  const doc = document.getElementsByClassName('dicom-sort')[0];
  doc.innerHTML = '';
  try {
    fs.accessSync(path);
  } catch (exc) {
    createAndAppendDIV(doc, path + ' is not accessible on the filesystem.');
  }
  const view = new View(doc, '&nbsp;&nbsp;&nbsp;');
  const obsFiles = dirListObs(path);
  dicomSort(obsFiles).subscribe(
    function(dicom) {
      view.appendDicom(dicom);
    },
    function (err) {
      console.log('Error: ' + err);
    },
    function () {
      console.log('Completed');
    }
  );
  return false;
};

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
