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
      name: dicom.name,
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
      name: dicom.name,
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

module.exports = {
  mapToBidsRow: mapToBidsRow,
  mapToSeriesRow: mapToSeriesRow,
  humanReadableSize: humanReadableSize
};
