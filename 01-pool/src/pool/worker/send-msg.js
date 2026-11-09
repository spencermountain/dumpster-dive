import { parentPort } from 'node:worker_threads'

export const sendStatus = (state) => {
  parentPort.postMessage({ type: 'status', state: state })
}

export const sendPayload = (payload, counts) => {
  parentPort.postMessage({ type: 'payload', payload, counts })
}
