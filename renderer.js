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
                        var div = document.createElement('div');
                        div.textContent = f;
                        doc.appendChild(div);
                    });
                }
            });
        } else {
            doc.textContent = 'path does not exist';
        }
    })
    return false
}
