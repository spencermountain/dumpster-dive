import { createWriteStream, existsSync, statSync, renameSync, unlinkSync } from 'node:fs'
import path from 'node:path'
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

const userAgent = 'dumpster-dive (https://github.com/spencermountain/dumpster-dive)'

// download a url to disk.
// - if the file already exists, do nothing.
// - partial downloads land in '<dest>.part' and resume with a Range header,
//   so a killed 20gb download doesn't start over.
// - if the remote file changed since the partial was written (a 'latest'
//   dump rotating), the partial is thrown away rather than corrupted.
const download = async function (url, dest, progress, isRetry) {
  if (existsSync(dest)) {
    progress.note(`already have ${dest}`)
    return dest
  }
  let part = dest + '.part'
  let start = 0
  let partTime = 0
  if (existsSync(part)) {
    let stat = statSync(part)
    start = stat.size
    partTime = stat.mtimeMs
  }
  let headers = { 'user-agent': userAgent }
  if (start > 0) {
    headers.range = `bytes=${start}-`
  }
  let res = await fetch(url, { headers, redirect: 'follow' })

  const startOver = async function () {
    if (isRetry) {
      throw new Error(`download keeps failing to resume - ${url}`)
    }
    await res.body?.cancel()
    unlinkSync(part)
    progress.note('remote file changed - restarting download')
    return download(url, dest, progress, true)
  }

  if (res.status === 416) {
    // range starts at/after the end of the remote file. either our .part is
    // already the whole thing, or the remote shrank - check which.
    let head = await fetch(url, { method: 'HEAD', headers: { 'user-agent': userAgent } })
    let size = Number(head.headers.get('content-length') || 0)
    if (size > 0 && size === start) {
      renameSync(part, dest)
      return dest
    }
    return startOver()
  }
  if (!res.ok) {
    throw new Error(`download failed: ${res.status} ${res.statusText} - ${url}`)
  }
  if (start > 0 && res.status === 206) {
    let modified = Date.parse(res.headers.get('last-modified') || '')
    if (modified && modified > partTime) {
      return startOver() // this 206 is a slice of a newer file - can't append it
    }
  }
  if (start > 0 && res.status !== 206) {
    start = 0 // server ignored the range - the body is the whole file
  }
  let total = start + Number(res.headers.get('content-length') || 0)
  let done = start
  let label = path.basename(dest)
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
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'user-agent': userAgent } })
    return res.ok
  } catch (e) {
    return false
  }
}

export { download, urlExists }
