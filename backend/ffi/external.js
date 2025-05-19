// backend/ffi/external.js
import ffi from 'ffi-napi';
import ref from 'ref-napi';

const lib = ffi.Library('libm', {
  'ceil': [ 'double', [ 'double' ] ]
});

export default lib;
