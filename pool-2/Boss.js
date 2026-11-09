import { Worker } from 'node:worker_threads'
import { EventEmitter } from 'node:events'
import { JobQueue } from './lib/JobQueue.js'

const countKeys = ['pages', 'skipped', 'complete', 'errors']

const makeWorkerState = (index) => {
  return {
    index,
    status: 'idle', // idle | running | finished
    pauses: [], // reasons this worker is paused
    job: null,
    bytes: 0, // compressed bytes read for the current job
    size: null, // compressed size of the current job, when known
    pages: 0,
    skipped: 0,
    complete: 0,
    errors: 0,
    written: 0, // articles the writer has finished with
    startedAt: null, // first job assigned
    finishedAt: null, // last job done
    rate: 0, // compressed mb/s, over the last second or so
    rateAt: null,
    rateBytes: 0
  }
}

// refresh a worker's download rate once at least a second has passed
const updateRate = function (worker, bytes) {
  const now = Date.now()
  if (worker.rateAt === null) {
    worker.rateAt = now
    worker.rateBytes = bytes
    return
  }
  const seconds = (now - worker.rateAt) / 1000
  if (seconds >= 1) {
    worker.rate = (bytes - worker.rateBytes) / 1e6 / seconds
    worker.rateAt = now
    worker.rateBytes = bytes
  }
}

class Boss extends EventEmitter {
  constructor(opts, jobs) {
    super()
    this.opts = opts
    this.jobs = jobs // dump files still to assign
    this.jobsTotal = jobs.length
    this.jobsDone = 0
    this.workers = []
    this.threads = []
    this.closing = false
    this.finished = false
    // batches of parsed pages waiting for the writer, written one at a time
    const write = opts.writer || (async () => {})
    const writeBatch = async ({ index, batch }) => {
      await write(batch)
      this.workers[index].written += batch.length
      this.changed()
    }
    this.writeQueue = new JobQueue(writeBatch, {
      maxActive: 1,
      warningSize: opts.maxQueue
    })
    // too many unwritten batches: hold the workers until the queue drains
    this.writeQueue.onWarning = () => this.pauseAll('writeQueue')
    this.init()
  }
  init() {
    // no point in more workers than files
    const count = Math.min(this.opts.workerCount || 2, this.jobsTotal)
    // functions cannot cross into a worker thread
    const opts = { ...this.opts }
    delete opts.writer
    for (let i = 0; i < count; i++) {
      const thread = new Worker(new URL('./worker/index.js', import.meta.url), {
        type: 'module',
        workerData: { index: i, opts }
      })
      thread.on('message', (msg) => this.handleMessage(i, msg))
      thread.on('error', (err) => this.handleError(i, err))
      thread.on('exit', (code) => this.handleExit(i, code))
      this.threads.push(thread)
      this.workers.push(makeWorkerState(i))
    }
  }
  // a plain snapshot for any UI
  get state() {
    // copy the pauses array, so a store holding this snapshot never sees it mutate
    const workers = this.workers.map((w) => {
      return { ...w, pauses: [...w.pauses], paused: w.pauses.length > 0 }
    })
    const totals = { pages: 0, skipped: 0, complete: 0, errors: 0 }
    workers.forEach((w) => {
      countKeys.forEach((key) => {
        totals[key] += w[key]
      })
    })
    return {
      workers,
      totals,
      writeQueue: this.writeQueue.status,
      jobs: { total: this.jobsTotal, pending: this.jobs.length, done: this.jobsDone },
      finished: this.finished
    }
  }
  changed() {
    this.emit('state', this.state)
  }
  start() {
    this.workers.forEach((worker) => this.assignNext(worker))
  }
  // hand the next dump file to a worker, or retire it
  assignNext(worker) {
    const job = this.jobs.shift()
    if (!job) {
      worker.status = 'finished'
      worker.job = null
      worker.pauses = []
      worker.finishedAt = Date.now()
      worker.rate = 0
      this.changed()
      this.checkDone()
      return
    }
    worker.status = 'running'
    worker.job = job
    worker.bytes = 0
    worker.size = null
    worker.rateAt = null
    worker.startedAt = worker.startedAt || Date.now()
    this.threads[worker.index].postMessage({ type: 'job', job })
    this.changed()
  }
  handleMessage(index, msg) {
    if (this.closing) {
      return
    }
    const worker = this.workers[index]
    const { type } = msg
    if (type === 'start') {
      worker.size = msg.size
      worker.decoder = msg.decoder
    } else if (type === 'batch') {
      countKeys.forEach((key) => {
        worker[key] += msg.counts[key]
      })
      worker.bytes = msg.bytes
      updateRate(worker, msg.bytes)
      this.writeQueue.push({ index, batch: msg.payload })
    } else if (type === 'done') {
      worker.bytes = msg.bytes
      this.jobsDone += 1
      this.assignNext(worker)
    } else if (type === 'error') {
      worker.errors += 1
      this.emit('warn', { worker: index, job: msg.job, message: msg.message })
      this.assignNext(worker)
    }
    this.changed()
  }
  handleError(index, err) {
    this.emit('warn', { worker: index, message: err.message })
  }
  handleExit(index, code) {
    if (this.closing) {
      return
    }
    // a crashed worker is retired; its current job is lost
    const worker = this.workers[index]
    this.emit('warn', { worker: index, job: worker.job, message: `exited with code ${code}` })
    worker.status = 'finished'
    worker.job = null
    worker.finishedAt = Date.now()
    this.changed()
    this.checkDone()
  }
  // pause one worker for a reason; it resumes once every reason is lifted
  pause(index, reason = 'user') {
    const worker = this.workers[index]
    // nothing to hold once a worker is out of files
    if (worker.status === 'finished' || worker.pauses.includes(reason)) {
      return
    }
    worker.pauses.push(reason)
    if (worker.pauses.length === 1) {
      this.threads[index].postMessage({ type: 'pause' })
    }
    this.changed()
  }
  resume(index, reason = 'user') {
    const worker = this.workers[index]
    if (!worker.pauses.includes(reason)) {
      return
    }
    worker.pauses = worker.pauses.filter((r) => r !== reason)
    if (worker.pauses.length === 0) {
      this.threads[index].postMessage({ type: 'resume' })
    }
    this.changed()
  }
  pauseAll(reason = 'user') {
    this.workers.forEach((w) => this.pause(w.index, reason))
    if (reason === 'writeQueue') {
      this.watchDrain()
    }
  }
  resumeAll(reason = 'user') {
    this.workers.forEach((w) => this.resume(w.index, reason))
  }
  // when the write queue empties: let the workers go again, or finish up
  watchDrain() {
    this.writeQueue.onDrain = () => {
      this.resumeAll('writeQueue')
      this.checkDone()
    }
  }
  checkDone() {
    const working = this.workers.some((w) => w.status !== 'finished')
    if (working || this.closing) {
      return
    }
    if (!this.writeQueue.isIdle) {
      this.watchDrain()
      return
    }
    this.close()
  }
  async close() {
    this.closing = true
    const exits = this.threads.map((thread) => {
      return new Promise((resolve) => {
        thread.once('exit', resolve)
        thread.postMessage({ type: 'shutdown' })
      })
    })
    await Promise.all(exits)
    this.finished = true
    // one last snapshot, with the drained write queue
    this.changed()
    this.emit('done', this.state)
  }
}

export default Boss
