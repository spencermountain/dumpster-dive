import { parentPort, workerData } from 'node:worker_threads'
import { bunzipFile } from './lib/bunzip.js'
import { parsePage } from './lib/parse-page.js'

// each worker owns one job at a time:
//   read a byte-range of the dump → decompress → split '<page>' blocks →
//   wtf_wikipedia → post a batch every `chunkSize` articles.
//
// backpressure: after posting a batch we await an 'ack' from the pool before
// reading further. while paused, node stops pulling from the decompressor,
// its stdout pipe fills, and the whole chain stalls - so a slow writer
// never piles articles up in memory anywhere.
//
// batches cross the thread boundary as one JSON string: a single stringify
// both strips wtf's class instances (postMessage can't clone functions) and
// beats a structured clone of the whole object graph.

let ackResolve = null
let active = null // the stream of the job in-flight, for teardown on 'exit'

const waitForAck = function (msg) {
  return new Promise((resolve) => {
    ackResolve = resolve
    parentPort.postMessage(msg)
  })
}

const toJsonString = function (batch, stats) {
  try {
    return JSON.stringify(batch)
  } catch (e) {
    // a circular reference somewhere - save the rest of the batch
    let good = []
    for (let article of batch) {
      try {
        good.push(JSON.stringify(article))
      } catch (err) {
        stats.errors += 1
        stats.articles -= 1
      }
    }
    return `[${good.join(',')}]`
  }
}

const runJob = async function (job) {
  let stats = { pages: 0, articles: 0, redirects: 0, skipped: 0, errors: 0 }
  let delta = () => {
    let out = stats
    stats = { pages: 0, articles: 0, redirects: 0, skipped: 0, errors: 0 }
    return out
  }
  try {
    let batch = []
    let buffer = ''
    let out = bunzipFile(workerData.file, workerData.backend, {
      start: job.start,
      end: job.end,
      singleThread: true,
    })
    active = out
    out.setEncoding('utf8')

    for await (let chunk of out) {
      buffer += chunk
      let cursor = 0
      let end = -1
      while ((end = buffer.indexOf('</page>', cursor)) !== -1) {
        let start = buffer.indexOf('<page', cursor)
        if (start === -1 || start > end) {
          start = cursor // corrupt range - still never slice backwards
        }
        let xml = buffer.slice(start, end)
        cursor = end + 7
        stats.pages += 1
        let article = parsePage(xml, workerData, stats)
        if (article !== null) {
          stats.articles += 1
          batch.push(article)
          if (batch.length >= workerData.chunkSize) {
            let json = toJsonString(batch, stats)
            batch = []
            await waitForAck({ type: 'batch', id: job.id, json, delta: delta() })
          }
        }
      }
      if (cursor > 0) {
        buffer = buffer.slice(cursor) // compact once per chunk, not per page
      }
    }
    if (batch.length > 0) {
      await waitForAck({ type: 'batch', id: job.id, json: toJsonString(batch, stats), delta: delta() })
    }
    parentPort.postMessage({ type: 'done', id: job.id, delta: delta() })
  } catch (err) {
    parentPort.postMessage({ type: 'job-error', id: job.id, error: err.message || String(err), delta: delta() })
  } finally {
    active = null
  }
}

parentPort.on('message', (msg) => {
  if (msg.type === 'job') {
    runJob(msg)
  } else if (msg.type === 'ack') {
    if (ackResolve !== null) {
      let resolve = ackResolve
      ackResolve = null
      resolve()
    }
  } else if (msg.type === 'exit') {
    if (active !== null) {
      active.destroy(new Error('aborted')) // tears down the fs stream + child process
    }
    setImmediate(() => process.exit(0)) // one tick, so teardown handlers run
  }
})
