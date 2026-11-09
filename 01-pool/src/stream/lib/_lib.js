import { once } from 'node:events'

const printProgress = function (txt) {
  if (process.stdout && process.stdout.clearLine) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    process.stdout.write(txt)
  }
}

const streamIsFull = async function (stream) {
  // printProgress('waiting for lbzip2')
  await once(stream, 'drain') // automatic pause: lbzip2 is behind
  // printProgress('\n-')
}

export { printProgress, streamIsFull }
