import os from 'node:os'

const defaults = {
  lang: 'en',
  project: 'wikipedia',
  date: 'latest',
  fmt: 'md', // 'sm' | 'md' | 'lg'
  dir: './',
  pageviews: false,
  pageviewFile: null, // reuse a local pageviews-*-user.bz2 (skips its download)
  chunkSize: 100, // articles per writer callback
  workers: 0, // 0 → one per cpu core
  namespaces: [0], // which wiki namespaces to keep
  redirects: false, // parse + write redirect pages too?
  file: null, // path to a local -multistream.xml.bz2 (skips the download)
  index: null, // path to its index file (default: derived from `file`)
  plugin: null, // writer plugin - null → ndjson to stdout
  verbose: true, // heartbeat logging on stderr
  backend: null, // force a bz2 backend: 'lbzip2' | 'lbzcat' | 'bzcat' | 'js' (default: probe)
}

const normalize = function (userOpts = {}) {
  let opts = Object.assign({}, defaults, userOpts)
  if (Number.isFinite(opts.workers) === false || opts.workers <= 0) {
    opts.workers = os.cpus().length
  }
  opts.workers = Math.floor(opts.workers)
  if (Number.isFinite(opts.chunkSize) === false || opts.chunkSize < 1) {
    opts.chunkSize = defaults.chunkSize
  }
  opts.chunkSize = Math.floor(opts.chunkSize)
  if (['sm', 'md', 'lg'].includes(opts.fmt) === false) {
    throw new Error(`fmt must be 'sm', 'md' or 'lg' - got '${opts.fmt}'`)
  }
  return opts
}

export { defaults, normalize }
