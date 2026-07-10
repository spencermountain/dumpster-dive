import test from 'node:test'
import assert from 'node:assert'
import { createReadStream } from 'node:fs'
import { PassThrough } from 'node:stream'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBunzip, probeBunzip } from '../src/lib/bunzip.js'
import { decode } from '../src/lib/parse-page.js'
import readIndex from '../src/lib/read-index.js'
import partition from '../src/lib/partition.js'

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const dumpFile = path.join(fixtures, 'tinywiki-latest-pages-articles-multistream.xml.bz2')
const indexFile = path.join(fixtures, 'tinywiki-latest-pages-articles-multistream-index.txt.bz2')

// unbzip2-stream is an old-style 'through' stream, so real callers
// normalize behind a PassThrough - same as worker.js does
const slurp = function (stream) {
  return new Promise((resolve, reject) => {
    let all = ''
    let out = stream.pipe(new PassThrough())
    out.setEncoding('utf8')
    out.on('data', (str) => (all += str))
    out.on('end', () => resolve(all))
    out.on('error', reject)
    stream.on('error', reject)
  })
}

test('probe finds a backend', () => {
  let backend = probeBunzip()
  assert.ok(['lbzip2', 'lbzcat', 'bzcat', 'js'].includes(backend))
})

test('js backend decompresses concatenated streams', async () => {
  let text = await slurp(createReadStream(dumpFile).pipe(createBunzip('js')))
  assert.ok(text.startsWith('<mediawiki'))
  assert.ok(text.includes('<title>Toronto</title>'))
  assert.ok(text.includes('<title>Ontario</title>'))
  assert.ok(text.trim().endsWith('</mediawiki>'))
})

test('native backend matches js backend', { skip: probeBunzip() === 'js' }, async () => {
  let native = await slurp(createReadStream(dumpFile).pipe(createBunzip(probeBunzip())))
  let js = await slurp(createReadStream(dumpFile).pipe(createBunzip('js')))
  assert.strictEqual(native, js)
})

test('read-index finds stream offsets', async () => {
  let { offsets, pages } = await readIndex(indexFile, 'js')
  assert.strictEqual(pages, 6)
  assert.strictEqual(offsets.length, 2)
  assert.strictEqual(offsets[0], 157)
  assert.strictEqual(offsets[1], 545)
})

test('partition covers the file exactly, on stream boundaries', () => {
  let offsets = [100, 200, 300, 400, 500]
  let jobs = partition(offsets, 1000, 2)
  // contiguous: each job starts where the last ended
  assert.strictEqual(jobs[0].start, 100)
  for (let i = 1; i < jobs.length; i += 1) {
    assert.strictEqual(jobs[i].start, jobs[i - 1].end + 1)
  }
  // runs to the end of the file (inclusive end)
  assert.strictEqual(jobs[jobs.length - 1].end, 999)
  let streams = jobs.reduce((n, j) => n + j.streams, 0)
  assert.strictEqual(streams, 5)
})

test('xml entity decoding', () => {
  assert.strictEqual(decode('&lt;ref&gt;'), '<ref>')
  assert.strictEqual(decode('AT&amp;T'), 'AT&T')
  assert.strictEqual(decode('&amp;lt;'), '&lt;') // double-encoded stays literal
  assert.strictEqual(decode('&quot;hi&quot; &#039;yo&#039;'), `"hi" 'yo'`)
  assert.strictEqual(decode('&#8212;'), '—')
  assert.strictEqual(decode('&#x1F600;'), '😀')
  assert.strictEqual(decode('no entities'), 'no entities')
})

test('junk entities never throw', () => {
  assert.strictEqual(decode('&#11111111;'), '&#11111111;') // > 0x10ffff
  assert.strictEqual(decode('&#xFFFFFFFF;'), '&#xFFFFFFFF;')
  assert.strictEqual(decode('&bogus; &'), '&bogus; &')
})
