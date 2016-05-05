// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var fs = require('fs');
var exports = module.exports = {};

exports.attachElement = function(path) {
    var doc = document.getElementsByClassName('filelist')[0];
    doc.textContent = '';
    fs.exists(path, (exists) => {
        if (exists) {
            fs.readdir(path, (err, files) => {
                if (err){
                    doc.textContent = err;
                }
                else {
                    files.forEach((f) => {
                        recListDir(doc, f, path, '');
                    });
                }
            });
        } else {
            doc.textContent = 'path does not exist';
        }
    })
    return false
}

var recListDir = function(rootEl, path, path_so_far, indent) {
    var div = document.createElement('div');
    div.textContent = indent + path;
    rootEl.appendChild(div);
    var full_path = path_so_far + '/' + path;
    console.log(full_path);
    fs.stat(full_path, (err, stat) => {
        if (stat.isDirectory()) {
            fs.readdir(full_path, (err, files) => {
                files.forEach((f) => {
                    recListDir(div, f, full_path, '__' + indent);
                });
            });
        }
    });
}
