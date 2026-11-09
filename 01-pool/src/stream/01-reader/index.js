import fileReader from './file-reader.js'
import webReader from './web-reader.js'

// agnostic file/url reader, returns a stream
const createReader = async function (opts) {
  // create a ReadableStream from a local file
  if (opts.localFile) {
    return fileReader(opts)
  }

  // create a ReadableStream from a remote file
  return webReader(opts)
}

export default createReader
