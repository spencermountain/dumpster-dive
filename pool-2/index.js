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

const startPool = async function (options = {}) {
  const opts = { ...defaults, ...options }
  const jobs = await makeJobs(opts)
  const boss = new Boss(opts, jobs)
  boss.start()
  return boss
}

export default startPool
