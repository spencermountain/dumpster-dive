import { spawn } from 'node:child_process'
import { Duplex, PassThrough } from 'node:stream'
import pickDecoder from './pick-decoder.js'
import catchErrors from './catchers.js'

// command-line decoders, by name
const commands = {
  lbzip2: (threads) => ['lbzip2', ['-dc', '-n', String(threads)]], // parallel but unmaintained
  pbz2: (threads) => ['pbz2', ['-d', '-c', '-n', String(threads)]], // parallel rust one
  fbz: (threads) => ['fbz', ['decompress', '-q', '-P', String(threads), '-o', '-', '-']],
  pbzip2: (threads) => ['pbzip2', ['-d', `-p${threads}`]], // only parallel on multi-stream files
  pbzip: (threads) => ['pbzip2', ['-d', `-p${threads}`]],
  bzip2: () => ['bzip2', ['-dc']], // the standard linear one
  bzip: () => ['bzip2', ['-dc']]
}

const passthrough = () => {
  const stream = new PassThrough()
  return { stdin: stream, stdout: stream, name: 'passthrough' }
}

// a duplex { stdin, stdout } that turns .bz2 bytes into xml
const createDecoder = async function (opts, job = {}) {
  // uncompressed local files need no decoder
  if (job.file && !job.file.endsWith('.bz2')) {
    return passthrough()
  }
  const maxThreads = opts.maxThreads || 2
  const type = pickDecoder(opts.decoder)
  if (type === 'passthrough') {
    return passthrough()
  }
  if (commands[type]) {
    const [cmd, args] = commands[type](maxThreads)
    const decoder = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'inherit'] })
    catchErrors(decoder)
    decoder.name = type
    return decoder
  }
  // single-threaded wasm, unless Web Workers exist
  if (type === 'wasm' || type === 'bzip2-codec') {
    const { createDecompressionStream } = await import('bzip2-codec')
    const concurrency = typeof globalThis.Worker === 'function' ? maxThreads : 1
    const stream = Duplex.fromWeb(createDecompressionStream({ concurrency }))
    return { stdin: stream, stdout: stream, name: 'wasm' }
  }
  // slowest pure-js decoder, but works everywhere
  if (type === 'javascript' || type === 'js') {
    const { default: unbzip2 } = await import('unbzip2-stream')
    const stream = unbzip2()
    return { stdin: stream, stdout: stream, name: 'javascript' }
  }
  throw new Error(`Unsupported decoder: ${type}`)
}

export default createDecoder
