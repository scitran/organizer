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
const https = require('https');
const {remote} = require('electron');
const environmentNeedsBrowserHTTP = process.platform == 'linux';

if (environmentNeedsBrowserHTTP) {
  exports.fetch = window.fetch;
  exports.FormData = window.FormData;
} else {
  const _fetch = require('node-fetch');
  exports.FormData = require('form-data');
  // add the option rejectUnauthorized: false if ignore-certificate-errors is set
  if (remote.process.argv.indexOf('--ignore-certificate-errors') !== -1) {
    const agent = new https.Agent({rejectUnauthorized: false});
    exports.fetch = (url, options) => {
      if (typeof options !== 'object') {
        options = {};
      }
      if (!options.agent) {
        options.agent = agent;
      } else{
        options.agent = new https.Agent(
          Object.assign({},
            options.agent.options,
            {rejectUnauthorized: false}
          )
        );
      }
      return _fetch(url, options)
    };
  } else {
    exports.fetch = _fetch;
  }
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
