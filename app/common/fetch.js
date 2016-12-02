/*
We provide a light wrapper around using the fetch API to deal with
various issues we've run into with HTTP requests.

- HTTP requests that use Node's request.js library seem to have issues
  on Linux where multi-part POSTs stall after uploading 17100 bytes.
  See scitran/organizer#74 for more details.
- Very large uploads that use the browser's fetch API have strange
  failures where HTTP requests fail before a connection is opened
  with an ERR_FILE_NOT_FOUND.

Shimming this API with some simple compatability utilities seems to
solve these issues.

Usage example:

```
const {FormData,wrapBuffer,fetch} = require('./app/common/fetch');

const body = FormData();

// call wrapBuffer to do appropriate wrapping for environment.
body.append('attachment', wrapBuffer(image), 'upload.jpg')

fetch(host + '/message', {body}).then(function(response) {
  return response.json();
}).then(function(body) {
  // do something with response
});
```
*/

const environmentNeedsBrowserHTTP = process.platform == 'linux';

if (environmentNeedsBrowserHTTP) {
  exports.fetch = window.fetch;
  exports.FormData = window.FormData;
} else {
  exports.fetch = require('node-fetch');
  exports.FormData = require('form-data');
}

exports.wrapBuffer = function(buffer) {
  /*
  Browser FormData only accepts Blobs and Node's form-data
  only accepts plain Buffers. This makes it easier for
  HTTP code to handle this simply.
  */
  if (environmentNeedsBrowserHTTP) {
    return new Blob([buffer]);
  } else {
    return buffer;
  }
};
