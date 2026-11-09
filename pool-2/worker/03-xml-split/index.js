// Use Buffer's byte search to locate the closing page tag.
import { Buffer } from 'node:buffer'

const closeTag = '</page>'

// ingest a stream of bytes and split it into batches of whole pages
const splitStream = async (stream, gate, batchSize, cb) => {
  // Keep a partial batch across incoming chunks.
  let currentBatch = null
  let currentSize = 0

  for await (const chunk of stream) {
    const bytes = new Uint8Array(chunk.buffer || chunk, chunk.byteOffset || 0, chunk.byteLength)
    for (let offset = 0; offset < bytes.length;) {
      // Pause between batches too, since one chunk can contain several.
      await gate.wait()
      if (!currentBatch) {
        currentBatch = new Uint8Array(batchSize)
      }
      // Copy only what fits; a large chunk can fill several batches.
      const length = Math.min(currentBatch.length - currentSize, bytes.length - offset)
      currentBatch.set(bytes.subarray(offset, offset + length), currentSize)
      currentSize += length
      offset += length
      if (currentSize === currentBatch.length) {
        // Clip after the last closing page tag.
        const lastPage = Buffer.from(currentBatch.buffer).lastIndexOf(closeTag)
        if (lastPage === -1) {
          // A large page can fill the buffer before its closing tag arrives.
          const larger = new Uint8Array(currentBatch.length * 2)
          larger.set(currentBatch)
          currentBatch = larger
          continue
        }
        const end = lastPage + closeTag.length
        await cb(currentBatch.buffer.slice(0, end))
        // Keep the tail and return to the usual batch size after a large page.
        const tail = currentBatch.subarray(end, currentSize)
        currentSize = tail.length
        currentBatch = new Uint8Array(Math.max(batchSize, currentSize))
        currentBatch.set(tail)
      }
    }
  }
  // Flush the final partial batch
  if (currentSize > 0) {
    await gate.wait()
    await cb(currentBatch.buffer.slice(0, currentSize))
  }
}

export default splitStream
