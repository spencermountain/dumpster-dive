import { existsSync, statSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { normalize } from './defaults.js'
import { probeBunzip } from './lib/bunzip.js'
import { dumpUrl, indexUrl } from './lib/urls.js'
import { download } from './lib/download.js'
import loadPageviews from './lib/pageviews.js'
import readIndex from './lib/read-index.js'
import partition from './lib/partition.js'
import runPool from './lib/pool.js'
import Progress, { comma } from './lib/progress.js'
import consoleWriter from './writers/console.js'

// a plugin is { open?(opts), write(articles), close?(stats) }
// a bare async function is shorthand for { write }
const normalizePlugin = function (plugin) {
  if (plugin === null || plugin === undefined) {
    return consoleWriter
  }
  if (typeof plugin === 'function') {
    return { write: plugin }
  }
  if (typeof plugin.write !== 'function') {
    throw new Error('plugin must have a write(articles) method')
  }
  return plugin
}

// find (or fetch) the dump + its index file
const ensureFiles = async function (opts, progress) {
  if (opts.file !== null) {
    let index = opts.index || opts.file.replace(/-multistream\.xml\.bz2$/, '-multistream-index.txt.bz2')
    if (index === opts.file) {
      throw new Error(`cannot derive the index filename from '${opts.file}'\n  (pass the -multistream-index.txt.bz2 path as the 'index' option)`)
    }
    if (existsSync(opts.file) === false) {
      throw new Error(`cannot find dump file: ${opts.file}`)
    }
    if (existsSync(index) === false) {
      throw new Error(`cannot find index file: ${index}\n  (dumpster needs the -multistream-index.txt.bz2 that ships beside every multistream dump)`)
    }
    return { file: opts.file, index }
  }
  mkdirSync(opts.dir, { recursive: true })
  let fileUrl = dumpUrl(opts)
  let idxUrl = indexUrl(opts)
  let file = path.join(opts.dir, path.basename(fileUrl))
  let index = path.join(opts.dir, path.basename(idxUrl))
  await download(idxUrl, index, progress)
  await download(fileUrl, file, progress)
  return { file, index }
}

const dumpster = async function (userOpts = {}) {
  let opts = normalize(userOpts)
  let plugin = normalizePlugin(opts.plugin)
  let progress = new Progress(opts)
  let began = Date.now()

  let backend = opts.backend || probeBunzip()
  progress.note(`bz2 backend: ${backend}${backend === 'js' ? ' (pure-js fallback - installing lbzip2 will speed this up a lot)' : ''}`)

  // fetch the dump + the day's pageviews concurrently
  let [files, pageviews] = await Promise.all([
    ensureFiles(opts, progress),
    opts.pageviews === true ? loadPageviews(opts, backend, progress) : Promise.resolve(null),
  ])

  progress.note('reading multistream index…')
  let { offsets, pages } = await readIndex(files.index, backend)
  let fileSize = statSync(files.file).size
  let jobs = partition(offsets, fileSize, opts.workers)
  progress.note(`${comma(pages)} pages in ${comma(offsets.length)} streams → ${comma(jobs.length)} jobs on ${opts.workers} workers`)

  await plugin.open?.(opts)

  // articles flow: worker → (join pageviews) → plugin.write()
  let write = (batch) => {
    if (pageviews !== null) {
      for (let article of batch) {
        article.pageviews = pageviews.get(article.title) || 0
      }
    }
    return plugin.write(batch)
  }

  let workerData = {
    file: files.file,
    backend,
    fmt: opts.fmt,
    lang: opts.lang,
    namespaces: opts.namespaces,
    redirects: opts.redirects,
    chunkSize: opts.chunkSize,
  }

  progress.start(jobs.length)
  let stats = null
  try {
    stats = await runPool({ jobs, opts, workerData, write, progress })
  } finally {
    progress.stop()
    if (stats === null) {
      await plugin.close?.(null) // let the plugin disconnect even on failure
    }
  }
  stats.seconds = (Date.now() - began) / 1000
  stats.rate = stats.seconds > 0 ? Math.round(stats.articles / stats.seconds) : 0
  stats.workers = opts.workers
  stats.backend = backend
  await plugin.close?.(stats)
  return stats
}

export default dumpster
export { createBunzip, probeBunzip } from './lib/bunzip.js'
export { defaults } from './defaults.js'
