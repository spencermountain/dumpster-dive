import { parentPort, workerData } from 'node:worker_threads'
import handleErrors from './lib/_errors.js'
import Worker from './Worker.js'

// thread entry: one worker, driven by messages from the boss
const { index, opts } = workerData
handleErrors(index)

const w = new Worker({ index, opts, port: parentPort })
parentPort.on('message', (message) => {
  const { type } = message
  if (type === 'job') {
    w.doJob(message.job)
  } else if (type === 'pause') {
    w.pause()
  } else if (type === 'resume') {
    w.resume()
  } else if (type === 'stop') {
    w.stop()
  } else if (type === 'shutdown') {
    w.shutdown()
  }
})
