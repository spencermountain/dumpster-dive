import makeStream from './pipe-stream.js'
import makeGate from '../lib/Gate.js'
import makeMeter from './lib/RateMeter.js'

const startStream = async function (opts) {
  const meter = makeMeter('stream')
  const gate = makeGate()

  const stream = await makeStream(opts, gate, meter)

  const logger = setInterval(() => {
    meter.stat()
  }, 6000)

  stream.once('close', () => {
    // console.log('Stream ended')
    // timer.stop()
    clearInterval(logger)
    meter.stop()
  })
  return stream
}

export default startStream
