import { parentPort } from 'node:worker_threads'
import send from './send-msg.js'

// report, then let the boss retire this worker
const fail = function (reason) {
  send({ type: 'error', message: String(reason?.message || reason) })
  process.exit(1)
}

const init = function (index) {
  parentPort.on('messageerror', (err) => {
    console.log(`[w${index}] messageerror: ${err}`)
  })
  process.on('warning', (w) => {
    console.log(`[w${index}] warning:`, w.message)
  })
  process.on('uncaughtException', (err) => {
    console.log(`[w${index}] uncaughtException:`, err)
    fail(err)
  })
  process.on('unhandledRejection', (reason) => {
    console.log(`[w${index}] unhandledRejection:`, reason)
    fail(reason)
  })
}

export default init
