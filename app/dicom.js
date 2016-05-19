'use strict';

const fs = require('fs');
const dicomParser = require('dicom-parser');
const TAG_DICT = require('./dataDictionary.js').TAG_DICT;

const REVERSE_TAG_DICT = new Map(
  Object.keys(TAG_DICT).map(k => [TAG_DICT[k].name, TAG_DICT[k]])
);

const parse = (filePath) => {
  const dicomFileAsBuffer = fs.readFileSync(filePath);
  const size = dicomFileAsBuffer.length * dicomFileAsBuffer.BYTES_PER_ELEMENT;
  return {
    dp: dicomParser.parseDicom(dicomFileAsBuffer),
    size: size
  };
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
  const dp = parse(filePath).dp;
  let dump = [];
  for (let key of Object.keys(dp.elements)) {
    let tag = getTag(key);
    let value = dp.string(key);
    let line = (tag && (tag.name + ': ' + value)) || (key + ': ' + value);
    dump.push(line);
  }
  return dump;
};

const convertHeaderToMap = (header) => {
  let m = new Map();
  for (let key of Object.keys(header.elements)) {
    let tag = getTag(key);
    let value = header.string(key);
    if (tag) {
      m.set(tag.name, value);
    } else {
      m.set(key, value);
    }
  }
  return m;
};

const getSessionTimestamp = (dicomHeader) => {
  return dicomHeader.get('StudyDate') + ' ' + dicomHeader.get('StudyTime');
};
const getAcquisitionTimestamp = (dicomHeader) => {
  return dicomHeader.get('AcquisitionDate') + ' ' + dicomHeader.get('AcquisitionTime');
};

const dicomSort = (files) => files.map(
  (f) => {
    let dp, size;
    try {
      let parsed = parse(f);
      dp = parsed.dp;
      size = parsed.size;
    } catch (exc) {
      return {name: f};
    }
    const sessionUID = dp.string(getKeyFromName('StudyInstanceUID'));
    const seriesUID = dp.string(getKeyFromName('SeriesInstanceUID'));
    const manufacturer = dp.string(getKeyFromName('Manufacturer'));
    const acquisitionNumber = dp.string(getKeyFromName('AcquisitionNumber'));
    const acquisitionLabel = dp.string(getKeyFromName('SeriesDescription'));
    var acquisitionUID;
    if (manufacturer.toUpperCase() !== 'SIEMENS' && acquisitionNumber !== undefined) {
      acquisitionUID = seriesUID + '_' + acquisitionNumber;
    } else {
      acquisitionUID = seriesUID;
    }
    const fullHeader = convertHeaderToMap(dp);
    return {
      name: f,
      size: size,
      sessionUID: sessionUID,
      patientID: fullHeader.get('PatientID'),
      sessionTimestamp: getSessionTimestamp(fullHeader),
      acquisitionUID: acquisitionUID,
      acquisitionLabel: acquisitionLabel,
      acquisitionTimestamp: getAcquisitionTimestamp(fullHeader),
      fullHeader: fullHeader
    };
  }
).filter(
  (o) => {
    return o.sessionUID !== undefined && o.acquisitionUID !== undefined;
  }
);

module.exports = {
  dicomDump: dicomDump,
  dicomSort: dicomSort
};
