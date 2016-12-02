exports.readlines = function *readlines(buffer) {
  let start = 0;
  while (true) { // eslint-disable-line no-constant-condition
    let end = buffer.indexOf('\n', start);
    if (end === -1) {
      break;
    }
    yield buffer.slice(start, end + 1).toString().trim();
    start = end + 1;
  }
  if (start < buffer.length) {
    yield buffer.slice(start, buffer.length).toString().trim();
  }
}
