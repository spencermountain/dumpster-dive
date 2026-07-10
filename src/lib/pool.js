import { Worker } from 'node:worker_threads'

const workerUrl = new URL('../worker.js', import.meta.url)

// the worker pool, and the backpressure between workers and the writer.
//
// flow of an article batch:
//   worker posts {batch} and pauses itself until we ack
//   → pool pushes the batch onto writeQueue
//   → a single writer loop drains writeQueue, one plugin.write() at a time
//   → the worker's ack is sent right away if writeQueue is short,
//     or held until the writer catches up if it's backed up.
//
// memory stays bounded at ~(highWater + workers) batches no matter how slow
// the writer is: every worker is stalled awaiting an ack before it will
// parse another chunkSize of articles.
class Pool {
  constructor({ jobs, opts, workerData, write, progress }) {
    this.jobs = jobs.slice()
    this.opts = opts
    this.workerData = workerData
    this.write = write
    this.progress = progress
    this.workers = []
    this.writeQueue = []
    this.waiters = [] // workers whose ack we're holding back
    this.highWater = opts.workers
    this.jobsDone = 0
    this.closing = false
    this.error = null
    this.stats = {
      pages: 0,
      articles: 0,
      redirects: 0,
      skipped: 0,
      errors: 0,
      written: 0,
      failures: [],
      maxQueued: 0,
    }
  }

  run() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      let n = Math.min(this.opts.workers, this.jobs.length) // no idle threads for tiny wikis
      for (let i = 0; i < n; i += 1) {
        this.spawn()
      }
      this.writerLoop()
    })
  }

  spawn() {
    let worker = new Worker(workerUrl, { workerData: this.workerData })
    worker.job = null
    worker.batches = 0
    worker.dead = false
    worker.on('message', (msg) => this.onMessage(worker, msg))
    worker.on('error', (err) => this.onDeath(worker, err))
    worker.on('exit', (code) => {
      if (code !== 0) {
        this.onDeath(worker, new Error(`worker exited with code ${code}`))
      }
    })
    this.workers.push(worker)
    this.assign(worker)
  }

  assign(worker) {
    let job = this.jobs.shift()
    if (job !== undefined) {
      worker.job = job
      worker.batches = 0
      worker.postMessage({ type: 'job', id: job.id, start: job.start, end: job.end })
    } else {
      worker.job = null
      this.wake() // maybe that was the last job - let the writer loop check
    }
  }

  addStats(delta) {
    Object.keys(delta || {}).forEach((k) => {
      this.stats[k] += delta[k]
    })
  }

  onMessage(worker, msg) {
    if (this.closing) {
      return // late messages during teardown - ignore
    }
    if (msg.type === 'batch') {
      worker.batches += 1
      this.addStats(msg.delta)
      this.progress.tick({ articles: msg.delta.articles })
      this.writeQueue.push(JSON.parse(msg.json))
      this.stats.maxQueued = Math.max(this.stats.maxQueued, this.writeQueue.length)
      this.wake()
      if (this.writeQueue.length <= this.highWater) {
        worker.postMessage({ type: 'ack' })
      } else {
        this.waiters.push(worker) // writer is backed up - hold this worker
      }
    } else if (msg.type === 'done') {
      this.addStats(msg.delta)
      this.jobsDone += 1
      this.progress.tick({ jobsDone: this.jobsDone })
      this.assign(worker)
    } else if (msg.type === 'job-error') {
      this.addStats(msg.delta)
      this.failJob(worker.job, worker.batches, msg.error)
      this.assign(worker)
    }
  }

  onDeath(worker, err) {
    // a crashing worker fires 'error' then 'exit' - only handle it once
    if (this.closing || worker.dead) {
      return
    }
    worker.dead = true
    let job = worker.job
    worker.job = null
    this.workers = this.workers.filter((w) => w !== worker)
    this.waiters = this.waiters.filter((w) => w !== worker)
    this.failJob(job, worker.batches, err.message)
    this.spawn() // replace it
  }

  // retry a failed job once - but only if none of its articles were
  // dispatched yet, so a retry can never write duplicates.
  failJob(job, batches, error) {
    if (job === null || job === undefined) {
      return
    }
    if (batches === 0 && (job.retries || 0) < 1) {
      job.retries = (job.retries || 0) + 1
      this.jobs.unshift(job)
      this.progress.note(`retrying chunk at byte ${job.start} (${error})`)
    } else {
      this.jobsDone += 1
      this.stats.failures.push({ start: job.start, end: job.end, error })
      this.progress.note(`skipping chunk at byte ${job.start} (${error})`)
    }
  }

  wake() {
    if (this.wakeWriter) {
      let fn = this.wakeWriter
      this.wakeWriter = null
      fn()
    }
  }

  async writerLoop() {
    while (this.error === null) {
      let batch = this.writeQueue.shift()
      if (batch === undefined) {
        if (this.finished()) {
          this.shutdown()
          return
        }
        await new Promise((resolve) => (this.wakeWriter = resolve))
        continue
      }
      try {
        await this.write(batch)
      } catch (err) {
        this.abort(err)
        return
      }
      this.stats.written += batch.length
      if (this.writeQueue.length < this.highWater) {
        this.waiters.forEach((w) => w.postMessage({ type: 'ack' }))
        this.waiters = []
      }
    }
  }

  finished() {
    return this.jobs.length === 0 && this.workers.every((w) => w.job === null)
  }

  // ask each worker to tear down its streams (killing any child process),
  // then terminate stragglers - threads don't take their children with them.
  stopWorkers() {
    this.closing = true
    return Promise.all(
      this.workers.map((worker) => {
        return new Promise((resolve) => {
          let timer = setTimeout(() => worker.terminate().then(resolve), 2000)
          worker.once('exit', () => {
            clearTimeout(timer)
            resolve()
          })
          worker.postMessage({ type: 'exit' })
        })
      })
    )
  }

  async shutdown() {
    await this.stopWorkers()
    this.resolve(this.stats)
  }

  async abort(err) {
    this.error = err
    await this.stopWorkers()
    this.reject(err)
  }
}

const runPool = function (params) {
  let pool = new Pool(params)
  return pool.run()
}

export default runPool
