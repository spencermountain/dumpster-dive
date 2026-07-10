// minimal heartbeat logging, so a 3-hour run never feels dead.
// everything writes to stderr - stdout belongs to the console writer,
// so `dumpster -y > out.ndjson` stays clean.
const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const niceTime = function (secs) {
  if (secs < 90) {
    return `${Math.round(secs)}s`
  }
  if (secs < 5400) {
    return `${Math.round(secs / 60)}m`
  }
  return `${(secs / 3600).toFixed(1)}h`
}

const niceBytes = function (n) {
  if (n > 1e9) {
    return `${(n / 1e9).toFixed(1)}gb`
  }
  if (n > 1e6) {
    return `${Math.round(n / 1e6)}mb`
  }
  return `${Math.round(n / 1e3)}kb`
}

class Progress {
  constructor(opts = {}) {
    this.enabled = opts.verbose !== false
    this.isTTY = Boolean(process.stderr.isTTY)
    this.articles = 0
    this.jobsDone = 0
    this.jobsTotal = 0
    this.timer = null
    this.lastLine = ''
  }

  note(msg) {
    if (this.enabled) {
      this.clear()
      process.stderr.write(`  ${msg}\n`)
    }
  }

  download(label, done, total, finished) {
    if (this.enabled === false) {
      return
    }
    let now = Date.now()
    if (finished !== true && now - (this.lastDownload || 0) < 2000) {
      return
    }
    this.lastDownload = now
    let pct = total > 0 ? ` (${Math.round((done / total) * 100)}%)` : ''
    this.line(`↓ ${label}  ${niceBytes(done)} / ${niceBytes(total)}${pct}`)
    if (finished === true) {
      this.clear()
      process.stderr.write(`  ✓ downloaded ${label}\n`)
    }
  }

  start(jobsTotal) {
    this.jobsTotal = jobsTotal
    this.began = Date.now()
    if (this.enabled) {
      let every = this.isTTY ? 2000 : 30000
      this.timer = setInterval(() => this.render(), every)
      if (this.timer.unref) {
        this.timer.unref()
      }
    }
  }

  tick(obj) {
    this.articles += obj.articles || 0
    if (obj.jobsDone !== undefined) {
      this.jobsDone = obj.jobsDone
    }
  }

  render() {
    let secs = (Date.now() - this.began) / 1000
    let pct = this.jobsTotal > 0 ? Math.round((this.jobsDone / this.jobsTotal) * 100) : 0
    let rate = secs > 0 ? Math.round(this.articles / secs) : 0
    let msg = `${pct}%  ${comma(this.articles)} articles  ${comma(rate)}/s`
    if (this.jobsDone > 0 && this.jobsDone < this.jobsTotal) {
      let eta = ((this.jobsTotal - this.jobsDone) * secs) / this.jobsDone
      msg += `  ~${niceTime(eta)} left`
    }
    this.line(msg)
  }

  line(msg) {
    if (this.enabled === false) {
      return
    }
    if (this.isTTY) {
      process.stderr.write(`\r\x1b[2K  ${msg}`)
      this.lastLine = msg
    } else {
      process.stderr.write(`  ${msg}\n`)
    }
  }

  clear() {
    if (this.isTTY && this.lastLine !== '') {
      process.stderr.write('\r\x1b[2K')
      this.lastLine = ''
    }
  }

  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.clear()
  }
}

export default Progress
export { comma }
