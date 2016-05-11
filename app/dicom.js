'use strict';

const fs = require('fs');
const dicomParser = require('dicom-parser');
const TAG_DICT = require('./dataDictionary.js').TAG_DICT;

const REVERSE_TAG_DICT = new Map(
  Object.keys(TAG_DICT).map(k => [TAG_DICT[k].name, TAG_DICT[k]])
);

const parse = (filePath) => {
  const dicomFileAsBuffer = fs.readFileSync(filePath);
  return dicomParser.parseDicom(dicomFileAsBuffer);
};


const getTag = (key) => {
  const group = key.substring(1,5);
  const element = key.substring(5,9);
  const tagIndex = ('(' + group + ',' + element + ')').toUpperCase();
  return TAG_DICT[tagIndex];
};

const getKeyFromName = name => {
  if (REVERSE_TAG_DICT.get(name) !== undefined){
    const tag = REVERSE_TAG_DICT.get(name).tag;
    return ('x' + tag.substring(1,5) + tag.substring(6,10)).toLowerCase();
  }
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

const dicomSort = (files) => files.map(
  (f) => {
    let dp;
    try {
      dp = parse(f);
    } catch (exc) {
      return {name: f};
    }
    const session = dp.string(getKeyFromName('StudyInstanceUID'));
    const acquisition = dp.string(getKeyFromName('SeriesInstanceUID'));
    return {
      name: f,
      session: session,
      acquisition: acquisition
    };
  }
).filter(
  (o) => {
    return o.session !== undefined && o.acquisition !== undefined;
  }
);

module.exports = {
  dicomDump: dicomDump,
  dicomSort: dicomSort
};
