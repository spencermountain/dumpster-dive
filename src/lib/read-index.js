import { createReadStream } from 'node:fs'
import { bunzipFile } from './bunzip.js'

const NEWLINE = 10
const COLON = 58
const ZERO = 48
const NINE = 57

// the multistream index is 'offset:pageId:title', one line per page.
// 100 consecutive pages share an offset - each unique offset marks the start
// of an independently-decompressable bz2 stream inside the big dump file.
//
// enwiki's index is ~24m lines, so this scans raw bytes instead of
// materializing a string per line - only the leading integer matters.
const readIndex = async function (path, backend) {
  let stream = /\.bz2$/.test(path) ? bunzipFile(path, backend) : createReadStream(path)
  let offsets = []
  let pages = 0
  let last = -1
  let offset = 0
  let parsing = true // false → skipping the rest of the line
  let sawDigit = false
  for await (let chunk of stream) {
    for (let i = 0; i < chunk.length; i += 1) {
      let byte = chunk[i]
      if (parsing) {
        if (byte >= ZERO && byte <= NINE) {
          offset = offset * 10 + (byte - ZERO)
          sawDigit = true
        } else {
          if (byte === COLON && sawDigit) {
            pages += 1
            if (offset !== last) {
              offsets.push(offset)
              last = offset
            }
          } // else: malformed line - ignore it
          parsing = byte === NEWLINE
          offset = 0
          sawDigit = false
        }
      } else if (byte === NEWLINE) {
        parsing = true
      }
    }
  }
  return { offsets, pages }
}

export default readIndex
