import { parentPort } from 'node:worker_threads'
import { sendStatus } from './send-msg.js'

const tellManager = function (msg) {
  sendStatus({ alive: false, reason: msg })
  process.exit(1)
}

const init = function (workerData) {
  const { index } = workerData
  // console.log(`[w${index}]`, 'started')

  // error/warning logging handling
  parentPort.on('messageerror', (err) => {
    console.log(`[w${index}] messageerror: ${err}`)
  })
  process.on('warning', (w) => {
    console.log(`[w${index}] warning:`, w.message)
  })
  // report graceful exit
  parentPort.on('close', () => {
    // console.log(`[w${index}] port closed`)
  })
  process.on('exit', (code) => {
    if (code !== 0) {
      console.log(`[w${index}] exiting with code`, code)
    }
  })
  // unexpected failures
  process.on('uncaughtException', (err) => {
    console.log(`[w${index}] uncaughtException:`, err)
    tellManager(err)
  })
  process.on('unhandledRejection', (reason) => {
    console.log(`[w${index}] unhandledRejection:`, reason)
    tellManager(reason)
  })
}
export default init
