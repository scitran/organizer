const {readlines} = require('../../app/common/readlines');
const assert = require('assert');
const {Buffer} = require('buffer');

describe('readlines', function() {
  it('works for buffers that do not end in newline', function() {
    const test = Buffer.from('hi\nsup\nyeah');
    assert.deepEqual(Array.from(readlines(test)), ['hi', 'sup', 'yeah']);
  });
  it('works for buffers that end in newline', function() {
    const test = Buffer.from('hi\nsup\n');
    assert.deepEqual(Array.from(readlines(test)), ['hi', 'sup']);
  });
  it('works for buffers that start in newline', function() {
    const test = Buffer.from('\nhi\nsup');
    assert.deepEqual(Array.from(readlines(test)), ['', 'hi', 'sup']);
  });
});
