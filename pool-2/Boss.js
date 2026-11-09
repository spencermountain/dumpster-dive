import { Worker } from 'node:worker_threads'
import { EventEmitter } from 'node:events'
import { JobQueue } from './lib/JobQueue.js'

const countKeys = ['pages', 'skipped', 'complete', 'errors']

// one record per dump file, pending until a worker picks it up
const makeFileState = (job) => {
  return {
    ...job, // index, file, path or url, hash, size
    status: 'pending', // pending | running | finished | stopped | error
    worker: null, // index of the worker on it
    bytes: 0, // compressed bytes read so far
    pages: 0,
    skipped: 0,
    complete: 0,
    errors: 0,
    written: 0, // articles the writer has finished with
    startedAt: null,
    finishedAt: null,
    rate: 0, // compressed mb/s, over the last second or so
    rateAt: null,
    rateBytes: 0
  }
}

const makeWorkerState = (index) => {
  return {
    index,
    status: 'idle', // idle | running | finished
    pauses: [], // reasons this worker is paused
    file: null // index of the file it is on
  }
}

// refresh a file's download rate once at least a second has passed
const updateRate = function (file, bytes) {
  const now = Date.now()
  if (file.rateAt === null) {
    file.rateAt = now
    file.rateBytes = bytes
    return
  }
  const seconds = (now - file.rateAt) / 1000
  if (seconds >= 1) {
    file.rate = (bytes - file.rateBytes) / 1e6 / seconds
    file.rateAt = now
    file.rateBytes = bytes
  }
}

class Boss extends EventEmitter {
  constructor(opts, jobs) {
    super()
    this.opts = opts
    this.files = jobs.map(makeFileState)
    this.jobs = [...jobs] // dump files still to assign
    this.jobsDone = 0
    this.workers = []
    this.threads = []
    this.closing = false
    this.ending = false // asked to stop reading and finish with what we have
    this.finished = false
    this.startedAt = Date.now()
    this.finishedAt = null
    // batches of parsed pages waiting for the writer, written one at a time
    const write = opts.writer || (async () => {})
    const writeBatch = async ({ index, batch }) => {
      await write(batch)
      this.files[index].written += batch.length
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
    const count = Math.min(this.opts.workerCount || 2, this.files.length)
    // functions (writer, summary hooks) cannot cross into a worker thread
    const opts = Object.fromEntries(
      Object.entries(this.opts).filter(([, value]) => typeof value !== 'function')
    )
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
    // a file is paused when the worker on it is
    const files = this.files.map((f) => {
      const paused = f.status === 'running' && workers[f.worker].paused
      return { ...f, paused }
    })
    const totals = { pages: 0, skipped: 0, complete: 0, errors: 0, written: 0, bytes: 0 }
    files.forEach((f) => {
      countKeys.forEach((key) => {
        totals[key] += f[key]
      })
      totals.written += f.written
      totals.bytes += f.bytes
    })
    return {
      workers,
      files,
      totals,
      writeQueue: this.writeQueue.status,
      jobs: { total: this.files.length, pending: this.jobs.length, done: this.jobsDone },
      ending: this.ending,
      finished: this.finished,
      startedAt: this.startedAt,
      elapsed: (this.finishedAt || Date.now()) - this.startedAt
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
      worker.file = null
      worker.pauses = []
      this.changed()
      this.checkDone()
      return
    }
    const file = this.files[job.index]
    worker.status = 'running'
    worker.file = job.index
    file.status = 'running'
    file.worker = worker.index
    file.startedAt = Date.now()
    this.threads[worker.index].postMessage({ type: 'job', job })
    this.changed()
  }
  // a file has left its worker, one way or another
  settleFile(file, status) {
    file.status = status
    file.finishedAt = Date.now()
    file.rate = 0
  }
  handleMessage(index, msg) {
    if (this.closing) {
      return
    }
    const worker = this.workers[index]
    const file = this.files[worker.file]
    const { type } = msg
    if (type === 'start') {
      file.size = msg.size || file.size
      file.decoder = msg.decoder
    } else if (type === 'batch') {
      countKeys.forEach((key) => {
        file[key] += msg.counts[key]
      })
      file.bytes = msg.bytes
      updateRate(file, msg.bytes)
      this.writeQueue.push({ index: file.index, batch: msg.payload })
    } else if (type === 'done') {
      file.bytes = msg.bytes
      this.settleFile(file, 'finished')
      this.jobsDone += 1
      this.assignNext(worker)
    } else if (type === 'stopped') {
      // a job we cut short; its parsed batches are already queued
      this.settleFile(file, 'stopped')
      this.assignNext(worker)
    } else if (type === 'error') {
      file.errors += 1
      this.settleFile(file, 'error')
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
    // a crashed worker is retired; its current file is lost
    const worker = this.workers[index]
    const file = worker.file === null ? null : this.files[worker.file]
    this.emit('warn', { worker: index, job: file, message: `exited with code ${code}` })
    if (file) {
      this.settleFile(file, 'error')
    }
    worker.status = 'finished'
    worker.file = null
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
  // stop reading, write what has been parsed, and finish as a success
  endEarly() {
    if (this.ending || this.closing) {
      return
    }
    this.ending = true
    this.jobs = [] // nothing more gets assigned
    this.workers.forEach((worker) => {
      if (worker.status === 'running') {
        worker.pauses = [] // a held job can't stop
        this.threads[worker.index].postMessage({ type: 'stop' })
      }
    })
    this.changed()
    this.checkDone()
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
    this.finishedAt = Date.now()
    // one last snapshot, with the drained write queue
    this.changed()
    this.emit('done', this.state)
  }
}

export default Boss
