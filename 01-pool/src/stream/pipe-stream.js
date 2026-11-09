import makeReader from './01-reader/index.js'
import makeDecoder from './02-decoder/index.js'
import { streamIsFull } from './lib/_lib.js'

const runStream = async (opts, gate, meter) => {
  // setup file or http reader stream
  const reader = await makeReader(opts, gate)
  // use flexible best-available bz2 decoder
  const decoder = await makeDecoder(opts)

  // start running the stream: read from reader and write to decoder
  const pipeToDecoder = async () => {
    console.log('-- read-stream started --\n\n')
    meter.start()
    for await (const chunk of reader) {
      // support manual pause: parked here while paused
      await gate.wait()
      // update our speed meter
      if (meter) {
        meter.add(chunk.length)
      }
      // automatic pause: lbzip2 is behind
      const bufferIsFull = !decoder.stdin.write(chunk)
      if (bufferIsFull) {
        await streamIsFull(decoder.stdin)
      }
    }
    decoder.stdin.end() // download finished: let lbzip2 flush and exit
  }

  pipeToDecoder().catch((error) => decoder.stdout.destroy(error)) // not awaited: the caller gets stdout right away

  // allow the stream to be piped further
  return decoder.stdout
}

export default runStream
