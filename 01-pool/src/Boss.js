import Manager from './pool/Manager.js'
import splitStream from './lib/split-stream.js'
import makeGate from './lib/Gate.js'
import { EventEmitter } from 'node:events'
import { availableParallelism } from 'node:os'

const green = (str) => '\x1b[32m' + str + '\x1b[0m'
const dim = (str) => '\x1b[2m' + str + '\x1b[0m'
const yellow = (str) => '\x1b[33m' + str + '\x1b[0m'

class Boss extends EventEmitter {
  constructor(opts, stream) {
    super()
    this.opts = opts || {}
    this.stream = stream
    this.gate = makeGate() //pause/resume control
    this.managers = []
    this.workQueue = []
    this.writeQueue = []
    this.totals = {
      pages: 0,
      skipped: 0,
      complete: 0,
      errors: 0
    }
    this.heartbeat = setInterval(() => {
      this.updateCounts()
      this.emit('heartbeat', this.totals)
    }, 2500)
    this.init()
  }
  init() {
    const numWorkers = this.opts.workerCount || availableParallelism()
    for (let i = 0; i < numWorkers; i++) {
      const manager = new Manager({ index: i, opts: this.opts })
      manager.on('error', (err) => {
        this.emit('error', err)
      })
      this.managers.push(manager)

      // listen for ready results
      manager.on('payload', (articles) => {
        this.addPayload(articles)
      })
    }
  }
  addPayload(payload) {
    this.writeQueue.push(payload)
    if (this.writeQueue.length >= 2) {
      console.log(this.writeQueue.length, 'writequeue')
      // this.pause()
    }
    this.emit('results', this.writeQueue.pop())
  }
  updateCounts() {
    this.totals = {
      pages: 0,
      skipped: 0,
      complete: 0,
      errors: 0
    }
    this.managers.forEach((manager) => {
      this.totals.pages += manager.totals.pages
      this.totals.skipped += manager.totals.skipped
      this.totals.complete += manager.totals.complete
      this.totals.errors += manager.totals.errors
    })
    const { complete, pages } = this.totals
    const percent = Math.round((complete / pages) * 100)
    const msg = ` → ${green(complete.toLocaleString())} (${dim(percent + '%')})`
    console.log(msg)
  }
  smallestQueue() {
    const sorted = [...this.managers].sort((a, b) => a.state.queueLength - b.state.queueLength)
    const lowestQueueLength = sorted[0].state.queueLength
    return lowestQueueLength
  }
  // Pick the lowest reported queue without reordering the pool.
  async assignTask(batch) {
    if (this.smallestQueue() >= 15) {
      this.impatientPause()
      // Hold this batch until capacity returns instead of dropping it.
      await this.gate.wait()
    }
    const sorted = [...this.managers].sort((a, b) => a.state.queueLength - b.state.queueLength)
    sorted[0].assign(batch)
  }
  async startStream() {
    // Keep stream errors and worker cleanup on the same promise chain.
    try {
      await splitStream(this.stream, this.gate, (batch) => this.assignTask(batch))
    } finally {
      await this.close()
    }
  }
  pause() {
    console.log('\n   ╭ pausing')
    this.gate.pause()
  }
  // pause, but try to resume
  impatientPause() {
    this.pause()
    const waiting = setInterval(() => {
      const queue = this.smallestQueue()
      console.log(`   | ⌛ - queue: ${queue}`)
      if (queue <= 1) {
        clearInterval(waiting)
        this.resume()
      }
    }, 750)
  }
  resume() {
    console.log('   ╰ resuming')
    this.gate.resume()
  }

  // poll managers until they're all drained
  async allWorkersDone() {
    return new Promise((resolve) => {
      const waiting = setInterval(() => {
        const running = this.managers.filter((m) => m.state.queueLength > 0)
        if (running.length === 0) {
          clearInterval(waiting)
          resolve()
        } else {
          console.log(`  | → ${yellow(running.length)} workers draining`)
        }
      }, 750)
    })
  }
  async close() {
    console.log('\n  ╭-- Stream complete --')
    console.log('  | calmly closing worker-pool')
    clearInterval(this.heartbeat)
    await this.allWorkersDone()
    await Promise.all(this.managers.map((manager) => manager.calmExit()))
    console.log('  ╰ pool closed\n\n')
    this.emit('done', this.totals)
  }
}

export default Boss
