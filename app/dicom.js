'use strict';

const fs = require('fs');
const dicomParser = require('dicom-parser');
const TAG_DICT = require('./dataDictionary.js').TAG_DICT;

const parse = (filePath) => {
  const dicomFileAsBuffer = fs.readFileSync(filePath);
  return dicomParser.parseDicom(dicomFileAsBuffer);
};


const getTag = (tag) => {
  const group = tag.substring(1,5);
  const element = tag.substring(5,9);
  const tagIndex = ('(' + group + ',' + element + ')').toUpperCase();
  return TAG_DICT[tagIndex];
};

const dicomDump = (filePath) => {
  const dp = parse(filePath);
  let dump = [];
  for (let key of Object.keys(dp.elements)) {
    let tag = getTag(key);
    let value = dp.string(key);
    let line = (tag && (tag.name + ': ' + value)) || (key + ': ' + value);
    dump.push(line);
  }
  return dump;
};

module.exports = {
  dicomDump: dicomDump
};
