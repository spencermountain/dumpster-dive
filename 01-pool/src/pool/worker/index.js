// worker.js
import { parentPort, workerData } from 'node:worker_threads'
import handleErorrs from './_errors.js'
import { sendStatus } from './send-msg.js'
import doTask from './task.js'

const opts = workerData.opts || {}
handleErorrs(workerData)

const queue = []
// Keep one queue runner, and drain accepted tasks before closing the port.
let running = false
let closing = false

const makeState = () => {
  return {
    index: workerData.index,
    alive: !closing,
    queueLength: queue.length
  }
}

const next = () => {
  const task = queue.shift()
  doTask(task, opts) //synchronous
  if (queue.length) {
    setImmediate(next)
  } else {
    running = false
    if (closing) {
      parentPort.close()
    }
  }
}

// listen for all messages
parentPort.on('message', (message) => {
  const { type } = message

  if (type === 'task') {
    // are we building up a queue at all?
    if (queue.length > 4) {
      // console.log(`[w${index}] queue length: ${queue.length}`)
      const state = makeState()
      sendStatus(state)
    }
    queue.push(message.task)
    if (!running) {
      running = true
      setImmediate(next)
    }
    return
  }
  if (type === 'ping') {
    const state = makeState()
    sendStatus(state)
    return
  }
  if (type === 'shutdown') {
    // console.log(`[w${index}] shutting down`)
    closing = true
    sendStatus({ ...makeState(), reason: 'shutdown' })
    if (!running) {
      parentPort.close()
    }
    return
  }
})
