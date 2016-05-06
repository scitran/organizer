"use strict";

const fs = require('fs');
const dicomDump = require('./dicom.js').dicomDump;

const attachElement = function(path) {
    let doc = document.getElementsByClassName('filelist')[0];
    doc.textContent = '';
    fs.exists(path, (exists) => {
        if (exists) {
            fs.stat(path, (err, stat) => {
                if (stat.isDirectory()) {
                    dirList(doc, path, '');
                } else {
                    doc.textContent = 'path must be a directory';
                }
            });
        } else {
            doc.textContent = 'path does not exist';
        }
    });
    return false;
}

var dirList = function(root, dirPath, indent) {
    fs.readdir(dirPath, (err, files) => {
        files.forEach((f) => {
            if (!f.startsWith('.')) {
                let fPath = dirPath + '/' + f;
                fs.stat(fPath, (err, stat) => {
                    let element = createDIVorDicomLink(fPath, f, indent);
                    if (stat.isDirectory()) {
                        element.innerHTML += '/';
                        dirList(element, fPath, '&nbsp;&nbsp;' + indent);
                    }
                    root.appendChild(element);
                });
            }
        });
    });
}

var createDIVorDicomLink = function(fPath, f, indent) {
  let element = document.createElement('div');
  element.innerHTML = indent;
  if (fPath.endsWith('.dcm')) {
    let a = document.createElement('a');
    a.onclick = function(){return renderer.appendDicomDump(fPath);};
    a.setAttribute('href', '#');
    a.innerHTML = f;
    element.appendChild(a);
  } else {
    element.innerHTML += f;
  }
  return element;
}

const appendDicomDump = function(path) {
  let doc = document.getElementsByClassName('dicom-dump')[0];
  doc.innerHTML = '';
  dicomDump(path).forEach((line) => {
    let div = document.createElement('div');
    div.innerHTML = line;
    doc.appendChild(div);
  });
  return false;
}

module.exports = {
  attachElement: attachElement,
  appendDicomDump: appendDicomDump
}
