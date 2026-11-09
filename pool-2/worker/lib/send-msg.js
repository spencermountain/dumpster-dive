import { parentPort } from 'node:worker_threads'

// every message to the boss goes through here
const send = (msg) => parentPort.postMessage(msg)

export default send
