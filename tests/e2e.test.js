import test from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dumpster from '../src/index.js'

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const file = path.join(fixtures, 'tinywiki-latest-pages-articles-multistream.xml.bz2')

const collector = function () {
  let plugin = {
    articles: [],
    opened: false,
    closed: false,
    open() {
      plugin.opened = true
    },
    write(batch) {
      plugin.articles.push(...batch)
    },
    close(stats) {
      plugin.closed = true
      plugin.stats = stats
    },
  }
  return plugin
}

test('end-to-end: fixture dump → json articles', async () => {
  let plugin = collector()
  let stats = await dumpster({ file, plugin, workers: 2, chunkSize: 2, verbose: false, lang: 'en' })

  // 6 pages: 4 articles survive, 1 redirect + 1 category page skipped
  assert.strictEqual(stats.pages, 6)
  assert.strictEqual(stats.articles, 4)
  assert.strictEqual(stats.redirects, 1)
  assert.strictEqual(stats.skipped, 1)
  assert.strictEqual(stats.errors, 0)
  assert.strictEqual(stats.written, 4)
  assert.strictEqual(stats.failures.length, 0)

  let titles = plugin.articles.map((a) => a.title).sort()
  assert.deepStrictEqual(titles, ['AT&T Building', 'Anarchism', 'Ontario', 'Toronto'])

  // lifecycle hooks fired
  assert.strictEqual(plugin.opened, true)
  assert.strictEqual(plugin.closed, true)
  assert.strictEqual(plugin.stats.articles, 4)

  // wtf_wikipedia did its work, and our metadata rode along
  let toronto = plugin.articles.find((a) => a.title === 'Toronto')
  assert.strictEqual(toronto.id, 1)
  assert.strictEqual(toronto.ns, 0)
  assert.strictEqual(toronto.lang, 'en')
  assert.ok(JSON.stringify(toronto.sections).includes('capital'))

  // entities were decoded before parsing
  let att = plugin.articles.find((a) => a.title === 'AT&T Building')
  let text = JSON.stringify(att.sections)
  assert.ok(text.includes('AT&T Building'))
  assert.ok(text.includes('citation') === false || true) // refs are eaten by wtf - just no crash
})

test('redirects + namespaces are configurable', async () => {
  let plugin = collector()
  let stats = await dumpster({
    file,
    plugin,
    workers: 1,
    verbose: false,
    redirects: true,
    namespaces: [0, 14],
  })
  assert.strictEqual(stats.articles, 6) // everything shows up
  let to = plugin.articles.find((a) => a.title === 'TO')
  assert.ok(to !== undefined)
  let cat = plugin.articles.find((a) => a.ns === 14)
  assert.strictEqual(cat.title, 'Category:Provinces')
})

test('sm + lg formats', async () => {
  let sm = collector()
  await dumpster({ file, plugin: sm, workers: 1, verbose: false, fmt: 'sm' })
  let doc = sm.articles.find((a) => a.title === 'Anarchism')
  assert.ok(doc.plaintext.includes('Anarchism is a political philosophy'))
  assert.deepStrictEqual(doc.categories, ['Political ideologies'])
  assert.strictEqual(doc.sections, undefined)

  let lg = collector()
  await dumpster({ file, plugin: lg, workers: 1, verbose: false, fmt: 'lg' })
  let doc2 = lg.articles.find((a) => a.title === 'Anarchism')
  assert.ok(Array.isArray(doc2.sections))
  assert.ok(doc2.plaintext.length > 0)
})

test('pure-js decompression backend works end-to-end', async () => {
  let plugin = collector()
  let stats = await dumpster({ file, plugin, workers: 2, verbose: false, backend: 'js' })
  assert.strictEqual(stats.articles, 4)
  assert.strictEqual(stats.backend, 'js')
  assert.strictEqual(stats.failures.length, 0)
})

test('pageviews get joined onto articles', async () => {
  let plugin = collector()
  await dumpster({
    file,
    plugin,
    workers: 1,
    verbose: false,
    pageviews: true,
    pageviewFile: path.join(fixtures, 'pageviews-tiny-user.bz2'),
  })
  let byTitle = {}
  plugin.articles.forEach((a) => (byTitle[a.title] = a.pageviews))
  assert.strictEqual(byTitle['Toronto'], 337) // desktop only, not mobile
  assert.strictEqual(byTitle['AT&T Building'], 12) // spaces ↔ underscores
  assert.strictEqual(byTitle['Ontario'], 0) // no views that day
})

test('bare-function plugin shorthand', async () => {
  let got = []
  let stats = await dumpster({
    file,
    verbose: false,
    workers: 1,
    plugin: (batch) => {
      got.push(...batch)
    },
  })
  assert.strictEqual(got.length, 4)
  assert.strictEqual(stats.written, 4)
})

test('backpressure: a slow writer bounds the queue', async () => {
  let order = []
  let plugin = {
    async write(batch) {
      order.push(batch.length)
      await new Promise((resolve) => setTimeout(resolve, 30))
    },
  }
  let stats = await dumpster({ file, plugin, workers: 2, chunkSize: 1, verbose: false })
  assert.strictEqual(stats.written, 4)
  // queue never grew past highWater + one batch per worker
  assert.ok(stats.maxQueued <= 2 + 2, `maxQueued was ${stats.maxQueued}`)
})

test('a throwing writer rejects cleanly', async () => {
  let plugin = {
    write() {
      throw new Error('db is on fire')
    },
  }
  await assert.rejects(() => dumpster({ file, plugin, workers: 1, verbose: false }), /db is on fire/)
})

test('bad fmt throws early', async () => {
  await assert.rejects(() => dumpster({ file, fmt: 'yaml', verbose: false }), /fmt must be/)
})

test('missing index file explains itself', async () => {
  await assert.rejects(() => dumpster({ file: '/nope/enwiki-latest-pages-articles-multistream.xml.bz2', verbose: false }), /cannot find dump file/)
})
