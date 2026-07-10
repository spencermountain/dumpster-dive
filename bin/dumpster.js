#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'
import prompts from 'prompts'
import dumpster from '../src/index.js'
import { defaults } from '../src/defaults.js'

const version = createRequire(import.meta.url)('../package.json').version

const usage = `dumpster-dive v${version}
parse a wikipedia dump into json

usage:
  dumpster                          interactive setup (press enter for defaults)
  dumpster -y                       just go, with the defaults
  dumpster --lang fr --fmt sm -y    skip the dialog with flags
  dumpster -y > enwiki.ndjson       articles stream to stdout, logs to stderr

flags:
  -l, --lang        language code               (${defaults.lang})
  -p, --project     wikipedia, wiktionary, …    (${defaults.project})
      --date        dump date, or 'latest'      (${defaults.date})
      --fmt         json size: sm, md, lg       (${defaults.fmt})
  -d, --dir         where dump files download   (${defaults.dir})
      --pageviews   add daily pageview counts   (off)
      --redirects   include redirect pages      (off)
  -w, --workers     worker threads              (cpu cores)
      --chunk-size  articles per batch          (${defaults.chunkSize})
  -f, --file        use a local .xml.bz2 dump   (skips download)
  -y, --yes         accept defaults, no dialog
  -q, --quiet       no heartbeat logging
  -h, --help
  -v, --version
`

const args = parseArgs({
  options: {
    lang: { type: 'string', short: 'l' },
    project: { type: 'string', short: 'p' },
    date: { type: 'string' },
    fmt: { type: 'string' },
    dir: { type: 'string', short: 'd' },
    pageviews: { type: 'boolean' },
    redirects: { type: 'boolean' },
    workers: { type: 'string', short: 'w' },
    'chunk-size': { type: 'string' },
    file: { type: 'string', short: 'f' },
    yes: { type: 'boolean', short: 'y' },
    quiet: { type: 'boolean', short: 'q' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
}).values

if (args.help) {
  console.log(usage)
  process.exit(0)
}
if (args.version) {
  console.log(version)
  process.exit(0)
}

let opts = {}
const copy = function (key, flag, fn) {
  let val = args[flag || key]
  if (val !== undefined) {
    opts[key] = fn ? fn(val) : val
  }
}
copy('lang')
copy('project')
copy('date')
copy('fmt')
copy('dir')
copy('pageviews')
copy('redirects')
copy('file')
copy('workers', 'workers', Number)
copy('chunkSize', 'chunk-size', Number)
if (args.quiet) {
  opts.verbose = false
}

// the dialog - enter-enter-enter accepts every default
const askUser = async function () {
  const onCancel = () => {
    process.exit(0)
  }
  const projects = ['wikipedia', 'wiktionary', 'wikiquote', 'wikivoyage', 'wikisource', 'wikinews', 'wikibooks', 'wikiversity']
  const fmts = ['md', 'sm', 'lg']
  let questions = [
      {
        type: 'text',
        name: 'lang',
        message: 'language',
        initial: opts.lang || defaults.lang,
      },
      {
        type: 'select',
        name: 'project',
        message: 'project',
        choices: projects.map((p) => ({ title: p, value: p })),
        initial: Math.max(0, projects.indexOf(opts.project || defaults.project)),
      },
      {
        type: 'text',
        name: 'date',
        message: 'dump date',
        initial: opts.date || defaults.date,
      },
      {
        type: 'select',
        name: 'fmt',
        message: 'json size',
        choices: [
          { title: 'md - the wtf_wikipedia default', value: 'md' },
          { title: 'sm - plaintext + categories', value: 'sm' },
          { title: 'lg - everything', value: 'lg' },
        ],
        initial: Math.max(0, fmts.indexOf(opts.fmt || defaults.fmt)),
      },
      {
        type: 'text',
        name: 'dir',
        message: 'download dir',
        initial: opts.dir || defaults.dir,
      },
      {
        type: 'toggle',
        name: 'pageviews',
        message: 'add pageview counts?',
        initial: opts.pageviews === true,
        active: 'yes',
        inactive: 'no',
      },
  ]
  // prompts render on stderr, so `dumpster > out.ndjson` still works
  questions = questions.map((q) => Object.assign(q, { stdin: process.stdin, stdout: process.stderr }))
  let res = await prompts(questions, { onCancel })
  return res
}

const main = async function () {
  if (args.yes !== true && args.file === undefined) {
    if (process.stdin.isTTY) {
      let answers = await askUser()
      opts = Object.assign(opts, answers)
    } else {
      // no terminal to ask in - refuse to quietly start a 20gb download
      throw new Error('not a terminal - pass -y to accept the defaults, or set flags (see --help)')
    }
  }
  let stats = await dumpster(opts)
  let mins = (stats.seconds / 60).toFixed(1)
  process.stderr.write('\n  done! 🎉\n')
  process.stderr.write(`    ${stats.articles.toLocaleString()} articles written from ${stats.pages.toLocaleString()} pages\n`)
  process.stderr.write(`    skipped ${stats.redirects.toLocaleString()} redirects, ${stats.skipped.toLocaleString()} other-namespace pages\n`)
  if (stats.errors > 0) {
    process.stderr.write(`    ${stats.errors.toLocaleString()} pages failed to parse\n`)
  }
  if (stats.failures.length > 0) {
    process.stderr.write(`    ⚠ ${stats.failures.length} chunks failed and were skipped\n`)
  }
  process.stderr.write(`    ${mins} minutes, ${stats.rate.toLocaleString()} articles/sec, ${stats.workers} workers, '${stats.backend}' decompression\n`)
}

process.on('SIGINT', () => {
  process.stderr.write('\n  ⏹ cancelled\n')
  process.exit(1)
})

main().catch((err) => {
  process.stderr.write(`\n  ✗ ${err.message}\n`)
  process.exit(1)
})
