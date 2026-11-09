import { stat } from 'node:fs/promises'
import Boss from './Boss.js'
import getChecksums from './info/get-checksums.js'

const defaults = {
  host: 'https://dumps.wikimedia.org',
  project: 'wikipedia',
  workerCount: 2, // wikimedia asks for at most two concurrent downloads
  maxQueue: 5, // write batches waiting before workers are paused
  batchSize: 1024 * 1024 * 2, // bytes of xml parsed per batch
  namespaces: { 0: true }
}

const makeUrl = function (opts, file) {
  const { project, lang, date, host } = opts
  const proj = project === 'wikipedia' ? `${lang}wiki` : `${lang}${project}`
  return `${host}/other/mediawiki_content_current/${proj}/${date}/xml/bzip2/${file}`
}

// one job per dump file: local paths, or every part listed in the checksums
const makeJobs = async function (opts) {
  if (opts.files) {
    return opts.files.map((path, index) => ({ index, file: path.split('/').pop(), path }))
  }
  const checksums = await getChecksums(opts)
  return checksums.map((row, index) => {
    return { index, file: row.file, url: makeUrl(opts, row.file), hash: row.hash }
  })
}

// compressed size of a remote file, or null if the server won't say
const headSize = async function (url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return Number(response.headers.get('content-length')) || null
  } catch {
    return null
  }
}

const sizeOf = async function (job) {
  if (job.path) {
    const info = await stat(job.path)
    return info.size
  }
  return headSize(job.url)
}

// learn every file's size up front, a few at a time to stay polite to the server
const addSizes = async function (jobs) {
  for (let i = 0; i < jobs.length; i += 4) {
    const chunk = jobs.slice(i, i + 4)
    const sizes = await Promise.all(chunk.map(sizeOf))
    chunk.forEach((job, n) => {
      job.size = sizes[n]
    })
  }
}

const startPool = async function (options = {}) {
  const opts = { ...defaults, ...options }
  const jobs = await makeJobs(opts)
  await addSizes(jobs)
  const boss = new Boss(opts, jobs)
  boss.start()
  return boss
}

export default startPool
