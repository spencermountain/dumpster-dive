import runStream from './src/index.js'
import { Writable } from 'node:stream'

const opts = {
  // lang: 'af',
  lang: 'fr',
  project: 'wikipedia',
  date: '2026-10-01',
  host: 'https://dumps.wikimedia.org',
  maxThreads: 6,
  namespaces: {
    0: true, // main
    1: false // talk
  },
  maxQueue: 5,
  // Slow the example writer to see input pause as outstanding batches fill up.
  // decoder: 'passthrough',
  // decoder: 'javascript',
  // decoder: 'wasm',
  decoder: 'bzip2',
  // decoder: 'pbzip2',
  // decoder: 'fbz', // another rust one
  // decoder: 'pbz2', // new rust one
  // decoder: 'lbzip2',
  localFile: '/Users/spencer/Desktop/afwiki-2026-10-01-p2p470034.xml.bz2'
  // localFile: '/Users/spencer/Desktop/frwiki-2026-10-01-p13159990p17639014.xml.bz2'
}
await runStream(opts)
// stream.pipe(process.stdout)
// stream.pipe(devNull)
