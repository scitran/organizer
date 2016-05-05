// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var fs = require('fs');
var exports = module.exports;

module.exports.attachElement = function(path) {
    var doc = document.getElementsByClassName('filelist')[0];
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
    return false
}

var dirList = function(root, dirPath, indent) {
    console.log(dirPath);
    fs.readdir(dirPath, (err, files) => {
        files.forEach((f) => {
            if (!f.startsWith('.')) {
                var fPath = dirPath + '/' + f;
                console.log(fPath);
                fs.stat(fPath, (err, stat) => {
                    var div = document.createElement('div');
                    div.innerHTML = indent + f;
                    if (stat.isDirectory()) {
                        div.innerHTML += '/';
                        dirList(div, fPath, '&nbsp;&nbsp;' + indent);
                    }
                    root.appendChild(div);
                });
            }
        });
    });
}
