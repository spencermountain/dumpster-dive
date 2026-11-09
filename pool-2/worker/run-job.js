import { once } from 'node:events'
import makeReader from './01-reader/index.js'
import makeDecoder from './02-decoder/index.js'
import splitStream from './03-xml-split/index.js'
import parseBatch from './04-parse/index.js'

// stop reading and decoding, so both loops below settle
const teardown = function (stream, decoder) {
  if (stream.destroy) {
    stream.destroy()
  } else if (stream.cancel) {
    stream.cancel().catch(() => {})
  }
  decoder.stdout.destroy(new Error('job aborted'))
}

// fetch → unzip → parse one dump file, pausing wherever the gate is closed
// gate: pause switch, send: posts to the boss, signal: aborts the job
const runJob = async function (job, opts, { gate, send, signal }) {
  const { stream, size } = await makeReader(job, signal)
  const decoder = await makeDecoder(opts, job)
  signal.addEventListener('abort', () => teardown(stream, decoder), { once: true })
  send({ type: 'start', job, size, decoder: decoder.name })
  let bytes = 0

  // feed compressed bytes to the decoder, respecting its backpressure
  const pump = async () => {
    for await (const chunk of stream) {
      await gate.wait()
      bytes += chunk.length
      if (!decoder.stdin.write(chunk)) {
        await once(decoder.stdin, 'drain')
      }
    }
    decoder.stdin.end()
  }
  const pumping = pump().catch((err) => decoder.stdout.destroy(err))

  // parse each batch of pages synchronously, then hand the results to the boss
  await splitStream(decoder.stdout, gate, opts.batchSize, (buffer) => {
    const { payload, counts } = parseBatch(buffer, opts)
    send({ type: 'batch', payload, counts, bytes })
  })
  await pumping
  return { job, bytes }
}

export default runJob
