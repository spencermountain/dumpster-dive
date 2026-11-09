const green = (str) => '\x1b[32m' + str + '\x1b[0m'
const yellow = (str) => '\x1b[33m' + str + '\x1b[0m'

class Timer {
  constructor(label) {
    this.label = label
    this.startTime = null
  }

  start() {
    this.startTime = performance.now()
    return this
  }

  timeSince() {
    const t = this.startTime || performance.now()
    const seconds = (performance.now() - t) / 1000
    const time = seconds < 60 ? `${seconds.toFixed(2)} s` : `${(seconds / 60).toFixed(2)} min`
    if (this.label) {
      return `${yellow(this.label)}: ${green(time)}`
    }
    return green(time)
  }

  stat() {
    console.log(this.timeSince())
  }
  stop() {
    console.log(this.timeSince())
    this.startTime = null
    return this
  }
}

export default function () {
  return new Timer()
}
