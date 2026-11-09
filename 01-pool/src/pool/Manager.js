import { Worker } from 'node:worker_threads'
import { EventEmitter } from 'node:events'

class Manager extends EventEmitter {
  constructor(opts) {
    super()
    this.opts = opts
    this.index = opts.index
    this.w = this.init()
    this.totals = {
      pages: 0,
      skipped: 0,
      complete: 0,
      errors: 0
    }
    this.state = {
      alive: true,
      queueLength: 0
    }
    this.interval = setInterval(() => {
      this.w.postMessage({ type: 'ping' })
    }, 2000)
  }
  init() {
    const w = new Worker(new URL('./worker/index.js', import.meta.url), {
      type: 'module',
      workerData: this.opts
    })
    w.on('error', (err) => console.error('error', err))
    w.on('exit', (code) => {
      this.state.alive = false
      clearInterval(this.interval)
      if (code !== 0) {
        this.emit('error', new Error(`Worker ${this.index} stopped with exit code ${code}`))
      }
    })
    // listen to worker messages
    w.on('message', (msg) => {
      const { type } = msg
      if (type === 'status') {
        const { state } = msg
        // console.log(`[w${this.index}]`, state)
        this.state = state
      } else if (type === 'payload') {
        const { counts } = msg
        // Payloads contain counts, not a worker-state snapshot.
        Object.keys(this.totals).forEach((key) => {
          this.totals[key] += counts[key]
        })
        this.emit('payload', msg.payload)
        // console.log(`[w${this.index}]: ${green(counts.complete)} pages of ${yellow(counts.pages)}`)
      }
    })
    return w
  }
  // recieve another buffer from the Boss
  assign(task) {
    this.w.postMessage({ type: 'task', task }, [task])
  }
  calmExit() {
    const { w } = this
    clearInterval(this.interval)
    if (this.closing) {
      return this.closing
    }
    // An exited worker cannot emit another exit event.
    if (w.threadId === -1) {
      return Promise.resolve()
    }
    // Wait for actual exit, not a cached queue length that excludes active work.
    this.closing = new Promise((resolve) => {
      w.once('exit', (code) => {
        this.state.alive = false
        resolve(code)
      })
      // this fires first
      w.postMessage({ type: 'shutdown' })
    })
    return this.closing
  }
}

export default Manager
