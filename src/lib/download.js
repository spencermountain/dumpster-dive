import { createWriteStream, existsSync, statSync, renameSync } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

class ByteCounter extends Transform {
  constructor(onBytes) {
    super()
    this.onBytes = onBytes
  }
  _transform(chunk, enc, cb) {
    this.onBytes(chunk.length)
    cb(null, chunk)
  }
}

// download a url to disk.
// - if the file already exists, do nothing.
// - partial downloads land in '<dest>.part' and resume with a Range header,
//   so a killed 20gb download doesn't start over.
const download = async function (url, dest, progress) {
  if (existsSync(dest)) {
    progress.note(`already have ${dest}`)
    return dest
  }
  let part = dest + '.part'
  let start = existsSync(part) ? statSync(part).size : 0
  let headers = { 'user-agent': 'dumpster-dive (https://github.com/spencermountain/dumpster-dive)' }
  if (start > 0) {
    headers.range = `bytes=${start}-`
  }
  let res = await fetch(url, { headers, redirect: 'follow' })
  if (res.status === 416) {
    // our .part file is already the whole thing
    renameSync(part, dest)
    return dest
  }
  if (!res.ok) {
    throw new Error(`download failed: ${res.status} ${res.statusText} - ${url}`)
  }
  if (start > 0 && res.status !== 206) {
    start = 0 // server ignored the range request - begin again
  }
  let total = start + Number(res.headers.get('content-length') || 0)
  let done = start
  let label = dest.replace(/^.*\//, '')
  let counter = new ByteCounter((n) => {
    done += n
    progress.download(label, done, total)
  })
  await pipeline(
    Readable.fromWeb(res.body),
    counter,
    createWriteStream(part, { flags: start > 0 ? 'a' : 'w' })
  )
  renameSync(part, dest)
  progress.download(label, done, total, true)
  return dest
}

const urlExists = async function (url) {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return res.ok
  } catch (e) {
    return false
  }
}

export { download, urlExists }
