'use strict';
const React = require('react');

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
}

class DicomRow extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const acqLabel = this.props.acquisition.acquisitionLabel;
    const acqTimestamp = this.props.acquisition.acquisitionTimestamp;
    const rowClass = this.props.highlighted?'tr-highlighted':''
    return (
      <tr className={rowClass}>
        <th>{this.props.session}</th>
        <th>{this.props.patient}</th>
        <th>{acqLabel}</th>
        <th>{acqTimestamp}</th>
        <th>{this.props.acquisition.count}</th>
        <th>{humanReadableSize(this.props.acquisition.size)}</th>
      </tr>
    );
  }
}

class DicomTable extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    let sessions = new Map;
    console.log(this.props.dicoms);
    this.props.dicoms.forEach((dicom) => {
      if (!sessions.has(dicom.sessionUID)) {
        sessions.set(
          dicom.sessionUID,
          {
            acqMap: new Map,
            sessionTimestamp: dicom.sessionTimestamp,
            patientID: dicom.patientID
          }
        );
      }
      let {acqMap} = sessions.get(dicom.sessionUID);
      if (!acqMap.has(dicom.acquisitionUID)) {
        acqMap.set(
          dicom.acquisitionUID,
          {
            acquisitionLabel: dicom.acquisitionLabel,
            acquisitionTimestamp: dicom.acquisitionTimestamp,
            count: 0,
            size: 0
          }
        );
      }
      let acquisition = acqMap.get(dicom.acquisitionUID);
      acquisition.count += 1;
      acquisition.size += dicom.size;
    });
    let rows = [];
    let even = false;
    sessions.forEach((session) => {
      let first = true;
      session.acqMap.forEach(
        (v) => {
          if (first) {
            rows.push(<DicomRow highlighted={even} session={session.sessionTimestamp} patient={session.patientID} acquisition={v} />);
            first = false;
          } else {
            rows.push(<DicomRow highlighted={even} session="" patient="" acquisition={v} />);
          }
        }
      );
      even = !even;
    });
    return (
      <table>
        <thead>
          <tr>
            <th>Session Timestamp</th>
            <th>Patient ID</th>
            <th>Acquisition Label</th>
            <th>Acquisition Timestamp</th>
            <th>Files</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

module.exports = DicomTable;
