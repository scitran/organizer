'use strict';

const getSessionTimestamp = (dicomHeader) => {
  return dicomHeader.StudyDate + ' ' + dicomHeader.StudyTime;
};
const getAcquisitionTimestamp = (dicomHeader) => {
  return dicomHeader.AcquisitionDate + ' ' + dicomHeader.AcquisitionTime;
};

const humanReadableSize = (size) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];

  for (let s of sizes) {
    let newSize = Math.floor(size/1024);
    if (newSize === 0) {
      return size.toString() + ' ' + s;
    } else {
      size = newSize;
    }
  }
  return size.toString() + ' TB';
};

const mapToSeriesRow = (dicoms) => dicoms.map(
  (dicom) => {
    const header = dicom.header;
    const sessionUID = header.StudyInstanceUID;
    const seriesUID = header.SeriesInstanceUID;
    const manufacturer = header.Manufacturer;
    const acquisitionNumber = header.AcquisitionNumber;
    const acquisitionLabel = header.SeriesDescription;
    var acquisitionUID;
    if (manufacturer.toUpperCase() !== 'SIEMENS' && acquisitionNumber !== undefined) {
      acquisitionUID = seriesUID + '_' + acquisitionNumber;
    } else {
      acquisitionUID = seriesUID;
    }
    return {
      path: dicom.path,
      size: dicom.size,
      sessionUID: sessionUID,
      patientID: header.PatientID,
      sessionTimestamp: getSessionTimestamp(header),
      acquisitionUID: acquisitionUID,
      acquisitionLabel: acquisitionLabel,
      acquisitionTimestamp: getAcquisitionTimestamp(header),
      header: dicom.header
    };
  }
).filter(
  (o) => {
    return o.sessionUID !== undefined && o.acquisitionUID !== undefined;
  }
);

const mapToBidsRow = (dicoms) => dicoms.map(
  (dicom) => {
    const header = dicom.header;
    const sessionUID = header.StudyInstanceUID;
    const seriesUID = header.SeriesInstanceUID;
    const manufacturer = header.Manufacturer;
    const acquisitionNumber = header.AcquisitionNumber;
    const acquisitionLabel = header.SeriesDescription;
    var acquisitionUID;
    if (manufacturer.toUpperCase() !== 'SIEMENS' && acquisitionNumber !== undefined) {
      acquisitionUID = seriesUID + '_' + acquisitionNumber;
    } else {
      acquisitionUID = seriesUID;
    }
    return {
      path: dicom.path,
      size: dicom.size,
      sessionUID: sessionUID,
      patientID: header.PatientID,
      sessionTimestamp: getSessionTimestamp(header),
      acquisitionUID: acquisitionUID,
      acquisitionLabel: acquisitionLabel,
      acquisitionTimestamp: getAcquisitionTimestamp(header)
    };
  }
).filter(
  (o) => {
    return o.sessionUID !== undefined && o.acquisitionUID !== undefined;
  }
);

const bidsLevels = {
  'series': 'projects',
  'projects': 'subjects',
  'subjects': 'sessions',
  'sessions': 'acquisitions'
};

const mapBidsFolderToSeries = (files) => {
  // files.forEach(function(f){
  //   console.log(f);
  // });
  let series = {
    level: 'series',
    projects: [],
    path: ''
  };
  let pointers = {
    '': series
  };
  return files.reduce(
    function(pointers, f){
      console.log(f.path);
      let parentPointer = pointers[f.parent];
      let pointer = createPointer(parentPointer.level, f);
      console.log(parentPointer);
      if (pointer.level) {
        parentPointer[pointer.level].push(pointer);
        pointers[f.path] = pointer;
      } else {
        parentPointer.files.push(pointer);
      }
      return pointers;
    }, pointers)
    .map(function(pointers){
      let bidsSeries = pointers[''];
      let series = {projects: []};
      for (let p of bidsSeries.projects) {
        let project = Object.assign({}, p, {
          sessions: []
        });
        delete project.subjects;
        series.projects.push(project);
        for (let sbj of p.subjects) {
          let subject = Object.assign({}, sbj);
          delete subject.sessions;
          for (let ses of sbj.sessions) {
            let session = Object.assign({}, ses,
              {subject: subject}
            );
            project.sessions.push(session);
          }
        }
      }
      return series;
    });
  function createPointer(parentPointerLevel, f){
    if (f.isFolder) {
      let pointer = {
        level: bidsLevels[parentPointerLevel],
        path: f.path,
        label: f.path.split('/').pop(),
        files: []
      };
      let childrenLevel = bidsLevels[pointer.level];
      if (childrenLevel) {
        pointer[childrenLevel] = [];
      }
      return pointer;
    } else {
      return {
        path: f.path
      };
    }
  }
};

module.exports = {
  mapBidsFolderToSeries: mapBidsFolderToSeries,
  mapToBidsRow: mapToBidsRow,
  mapToSeriesRow: mapToSeriesRow,
  humanReadableSize: humanReadableSize
};
