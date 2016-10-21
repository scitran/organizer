// you might have to install this package
const toIco = require('to-ico');

const fs = require('fs');
const path = require('path');

if (!fs.existsSync('package.json')) {
  throw new Error('this script must be run from the project root');
}

const iconDir = 'assets/osx/logo.iconset';
// explicitly enumerating everything except for the 512x512, which seems to crash the program
const files = [
  'icon_16x16.png',
  'icon_32x32.png',
  'icon_128x128.png',
  'icon_256x256.png'
].map(function(file) {
  return fs.readFileSync(path.join(iconDir, file));
});

toIco(files).then(buf => {
  fs.writeFileSync('assets/win/logo.ico', buf);
  console.log('done');
}, err => {
  console.log('error', err.stack);
});

