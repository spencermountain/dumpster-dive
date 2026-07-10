import { existsSync, mkdirSync } from 'node:fs'
import readline from 'node:readline'
import path from 'node:path'
import { bunzipFile } from './bunzip.js'
import { pageviewUrl } from './urls.js'
import { download, urlExists } from './download.js'

// pageview files land daily with a lag of a day or two - walk backwards
// from yesterday until we find one that exists.
const findRecent = async function (dir) {
  for (let daysAgo = 1; daysAgo <= 7; daysAgo += 1) {
    let date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    let url = pageviewUrl(date)
    let dest = path.join(dir, path.basename(url))
    if (existsSync(dest)) {
      return { url, dest, cached: true }
    }
    if (await urlExists(url)) {
      return { url, dest, cached: false }
    }
  }
  return null
}

// pageview titles are underscored and sometimes percent-encoded;
// normalize to the dump's decoded, spaced form so lookups are exact.
const normalTitle = function (str) {
  try {
    str = decodeURIComponent(str)
  } catch (e) {
    // not percent-encoded - keep it as-is
  }
  return str.replace(/_/g, ' ')
}

// download the day's pageview file and grep it down to one project,
// desktop hits only → an in-memory Map of title → view count.
const loadPageviews = async function (opts, backend, progress) {
  let dest = opts.pageviewFile // reuse an already-downloaded file across runs
  if (!dest) {
    mkdirSync(opts.dir, { recursive: true })
    let found = await findRecent(opts.dir)
    if (found === null) {
      progress.note('⚠ no recent pageview file found - skipping pageviews')
      return null
    }
    await download(found.url, found.dest, progress)
    dest = found.dest
  }
  let prefix = `${opts.lang}.${opts.project} `
  let map = new Map()
  let found = false
  let input = bunzipFile(dest, backend)
  let rl = readline.createInterface({ input, crlfDelay: Infinity })
  for await (let line of rl) {
    // format: 'en.wikipedia Toronto 64646 desktop 337 A16B14...'
    if (line.startsWith(prefix) === false) {
      if (found) {
        break // the file is sorted by project - we're past ours
      }
      continue
    }
    found = true
    let cols = line.split(' ')
    if (cols[3] === 'desktop') {
      map.set(normalTitle(cols[1]), Number(cols[4]) || 0)
    }
  }
  rl.close()
  input.destroy() // if we broke out early, shut down the decompressor too
  progress.note(`✓ loaded pageviews for ${map.size} pages`)
  return map
}

export default loadPageviews
