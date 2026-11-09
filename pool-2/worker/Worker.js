import makeGate from './lib/Gate.js'
import runJob from './run-job.js'

// one per thread: takes jobs from the boss and runs them one at a time
class Worker {
  constructor({ index, opts, port }) {
    this.index = index
    this.opts = opts
    this.port = port // parentPort, or a stand-in for tests
    this.gate = makeGate() // the boss opens and closes this
    this.running = null // promise for the current job
    this.aborter = null // cancels the current job's streams
    this.send = (msg) => this.port.postMessage(msg)
  }
  async doJob(job) {
    this.aborter = new AbortController()
    const { gate, send } = this
    this.running = runJob(job, this.opts, { gate, send, signal: this.aborter.signal })
    try {
      const result = await this.running
      send({ type: 'done', ...result })
    } catch (err) {
      // a job we cancelled ourselves is not an error
      if (!this.aborter.signal.aborted) {
        send({ type: 'error', job, message: err.message })
      }
    }
    this.running = null
  }
  pause() {
    this.gate.pause()
  }
  resume() {
    this.gate.resume()
  }
  // abort any current job, then close the port so the thread can exit
  async shutdown() {
    this.gate.resume() // a paused job can't settle
    if (this.running) {
      this.aborter.abort()
      await this.running.catch(() => {})
    }
    this.port.close()
  }
}

export default Worker
