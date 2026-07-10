<div align="center">
  <h2>dumpster-dive</h2>
  <div>parse a wikipedia dump into tidy json</div>
  <div><i>works on a normal laptop</i></div>
</div>

`dumpster-dive` downloads the latest wikipedia dump, decompresses it in parallel across your cpu cores, parses every article's wikitext with [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia), and hands you the json - to stdout, or to any database via a small writer plugin.

it uses the **multistream** dump: the compressed file is thousands of independent bzip2 blocks of 100 pages each, with an index mapping byte-offsets to blocks. that means random access into the compressed file, perfectly-parallel work units, and **no decompressed copy ever touches your disk**.

### command line

no setup needed:

```bash
npx dumpster-dive
```

that opens a little dialog - press enter a few times to accept the defaults, or:

```bash
# skip the dialog entirely
npx dumpster-dive -y > enwiki.ndjson

# french wiktionary, small json, with pageview counts
npx dumpster-dive --lang fr --project wiktionary --fmt sm --pageviews -y

# a dump you already have on disk
npx dumpster-dive -f ./enwiki-latest-pages-articles-multistream.xml.bz2 -y
```

articles stream to **stdout** as [ndjson](http://ndjson.org/) (one json article per line). all logging goes to stderr, so piping and redirecting stays clean. see `--help` for every flag.

### javascript

```js
import dumpster from 'dumpster-dive'

let stats = await dumpster({
  lang: 'en',
  plugin: async (articles) => {
    // called with batches of ~100 parsed articles
    await db.insertMany(articles)
  },
})
console.log(stats)
// { pages: 24182811, articles: 7012384, redirects: ..., seconds: ..., ... }
```

### options

```js
{
  lang: 'en',          // 'fr', 'de', 'zh'...
  project: 'wikipedia',// 'wiktionary', 'wikiquote', 'wikivoyage'...
  date: 'latest',      // or a specific dump like '20260601'
  fmt: 'md',           // json size: 'sm' | 'md' | 'lg'
  dir: './',           // where dump files download to
  pageviews: false,    // join daily view-counts onto each article
  chunkSize: 100,      // articles per plugin.write() call
  workers: 0,          // worker threads (0 → one per cpu core)
  namespaces: [0],     // which wiki namespaces to keep
  redirects: false,    // parse + write redirect pages too?
  file: null,          // local -multistream.xml.bz2 (skips download)
  index: null,         // its index file (default: derived from `file`)
  pageviewFile: null,  // local pageviews-*-user.bz2 (skips that download)
  plugin: null,        // writer plugin (default: ndjson to stdout)
  verbose: true,       // heartbeat logging on stderr
}
```

downloads resume if interrupted, and files you already have are never re-fetched.

### writer plugins

a plugin is just an object:

```js
const mongoPlugin = {
  async open(opts) {
    this.client = await MongoClient.connect(url)
    this.col = this.client.db(opts.lang).collection('articles')
  },
  async write(articles) {
    await this.col.insertMany(articles)
  },
  async close(stats) {
    await this.client.close()
  },
}
await dumpster({ plugin: mongoPlugin })
```

a bare `async function` works too, as shorthand for `{ write }`.

**backpressure is handled for you**: `write()` is called serially, one batch at a time, and the worker pool pauses decompression whenever your writer falls behind. a slow database never piles articles up in memory - the whole pipeline just slows to match it.

### how it works

```
   index file  →  byte-ranges of ~independent bz2 streams
       │
   worker pool (one thread per core)
       │            each: read range → bunzip → split <page> → wtf_wikipedia
       ▼
   batches of json articles  →  your plugin.write()
```

- **decompression** probes for the fastest available backend: `lbzip2`, then `bzcat` (ships with macos/linux), then falls back to pure-js [unbzip2-stream](https://github.com/regular/unbzip2-stream) - so it works anywhere node does, just faster where better tools exist. `brew install lbzip2` if you're in a hurry.
- **parsing** is [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia), which does the hard part.
- `fmt: 'sm'` is plaintext + categories, `'md'` is the wtf_wikipedia default json, `'lg'` adds images, coordinates + plaintext. the presets live in [src/lib/fmt.js](./src/lib/fmt.js).
- `pageviews: true` also grabs yesterday's [pageview file](https://dumps.wikimedia.org/other/pageview_complete/) and joins a `pageviews` count onto every article. (heads-up: that download is a couple GB, and the title→count map wants ~500mb of ram on enwiki)

### sizes

the english wikipedia is the big one - ~20gb download, a few hours of parsing on a laptop. every other language is easier: `fr` ~5gb, `de` ~6gb, most others are minutes. try `lang: 'af'` (or something tiny like `srn`) to get a feel for it first.

MIT
