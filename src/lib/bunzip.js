import { spawn, spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { Duplex, PassThrough, pipeline } from 'node:stream'
import unbzip2 from 'unbzip2-stream'

// a tiny bzip2 file holding the text 'ok\n' - used to prove a binary actually works
const probeFile = Buffer.from('QlpoOTFBWSZTWbingE8AAAFBAAAQAAigACGYGYFhdyRThQkLingE8A==', 'base64')

// fastest-first. lbzip2 is multi-threaded, bzcat ships with macos + most linux
const backends = {
  lbzip2: { cmd: 'lbzip2', args: ['-d', '-c'] },
  lbzcat: { cmd: 'lbzcat', args: [] },
  bzcat: { cmd: 'bzcat', args: [] },
}

// find the best available bz2 decompressor on this machine.
// run once in the main thread; workers get told the answer.
const probeBunzip = function () {
  let found = Object.keys(backends).find((name) => {
    let { cmd, args } = backends[name]
    try {
      let res = spawnSync(cmd, args, { input: probeFile, timeout: 5000 })
      return res.status === 0 && res.stdout && res.stdout.toString() === 'ok\n'
    } catch (e) {
      return false
    }
  })
  return found || 'js'
}

// returns a fresh pipeable duplex stream: write .bz2 bytes in, read text bytes out.
// all three backends present the same interface, so callers never care which one runs.
const createBunzip = function (backend, opts = {}) {
  backend = backend || probeBunzip()
  if (backend === 'js') {
    return unbzip2() // pure-js fallback - correct, but the slowest
  }
  let { cmd, args } = backends[backend]
  if (opts.singleThread && (backend === 'lbzip2' || backend === 'lbzcat')) {
    args = args.concat(['-n', '1']) // we manage our own parallelism in the worker pool
  }
  let proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'ignore'] })
  let duplex = Duplex.from({ writable: proc.stdin, readable: proc.stdout })
  proc.on('error', (err) => duplex.destroy(err))
  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      duplex.destroy(new Error(`${cmd} exited with code ${code}`))
    }
  })
  duplex.on('close', () => {
    if (proc.exitCode === null && proc.signalCode === null) {
      proc.kill()
    }
  })
  return duplex
}

// open a .bz2 file (or a byte-range of one) as a decompressed stream.
// pipeline() owns the teardown: an error - or destroying the returned
// stream - tears down the whole chain, so no fs handle or child process
// outlives a failure.
const bunzipFile = function (path, backend, opts = {}) {
  let source = createReadStream(path, { start: opts.start, end: opts.end })
  let bunzip = createBunzip(backend, opts)
  let out = new PassThrough()
  pipeline(source, bunzip, out, () => {}) // errors reach consumers through `out`
  return out
}

export { createBunzip, probeBunzip, bunzipFile }
