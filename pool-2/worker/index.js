import { parentPort, workerData } from 'node:worker_threads'

// listen for all messages
parentPort.on('message', (message) => {
  console.log(message)
})
