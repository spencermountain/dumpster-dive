// import { printProgress } from './_lib.js'
const green = (str) => '\x1b[32m' + str + '\x1b[0m'
const yellow = (str) => '\x1b[33m' + str + '\x1b[0m'
const dim = (str) => '\x1b[2m' + str + '\x1b[0m'

const niceBytes = (bytes) => {
  const units = ['b', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb']
  let total = bytes
  let unit = 0
  while (Math.abs(total) >= 1000 && unit < units.length - 1) {
    total /= 1000
    unit += 1
  }
  return `${Number(total.toFixed(1))} ${units[unit]}`
}

const niceRate = (bytes, seconds) => {
  const mbps = seconds ? bytes / 1e6 / seconds : 0
  return Number(mbps.toFixed(1)) + 'mb/s'
}

const niceTime = (seconds) => {
  return seconds < 60 ? `${Math.round(seconds)}s` : `${(seconds / 60).toFixed(2)}min`
}

export class RateMeter {
  constructor(label) {
    this.label = label
    this.bytes = 0
    this.startTime = null
    this.lastTime = null
    this.lastBytes = 0
  }

  start() {
    this.startTime = Date.now()
    this.bytes = 0
    this.lastTime = this.startTime
    this.lastBytes = 0
    return this
  }
  stop() {
    const formatted = niceBytes(this.bytes)
    const elapsed = niceTime(Math.round((Date.now() - this.startTime) / 1000))
    console.log(`${dim(this.label || '')} ${green(formatted)} in ${yellow(elapsed)}`)
    this.startTime = null
    this.bytes = 0
    return this
  }
  add(n) {
    this.bytes += n
  }

  // Rate since the previous update, so a stalled reader shows zero.
  stat() {
    if (!this.startTime) {
      return
    }
    const now = Date.now()
    const seconds = Math.round((now - this.startTime) / 1000)
    const rate = niceRate(this.bytes - this.lastBytes, (now - this.lastTime) / 1000)
    this.lastTime = now
    this.lastBytes = this.bytes
    const time = niceTime(seconds)
    const msg = `      ${yellow(rate)} @${time}`
    console.log(msg)
  }
}

const makeMeter = (label) => {
  return new RateMeter(label)
}
export default makeMeter
