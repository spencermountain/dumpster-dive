// builds tests/fixtures/tinywiki - a miniature pages-articles-multistream dump:
// real concatenated bz2 streams + the offset index, exactly like wikimedia ships.
// needs the bzip2 binary - run once via `npm run make-fixture`, commit the output.
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
mkdirSync(dir, { recursive: true })

const bzip = function (str) {
  let res = spawnSync('bzip2', ['-c'], { input: str })
  if (res.status !== 0) {
    throw new Error('bzip2 failed - is it installed?')
  }
  return res.stdout
}

const page = function (id, title, ns, text, redirect) {
  return `  <page>
    <title>${title}</title>
    <ns>${ns}</ns>
    <id>${id}</id>
    ${redirect ? `<redirect title="${redirect}" />` : ''}
    <revision>
      <id>${id * 100}</id>
      <text bytes="${text.length}" xml:space="preserve">${text}</text>
    </revision>
  </page>
`
}

const header = `<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.11/" version="0.11" xml:lang="en">
  <siteinfo>
    <sitename>Tinywiki</sitename>
    <dbname>tinywiki</dbname>
  </siteinfo>
`

// stream 1 - two articles + a redirect
const pages1 = [
  { id: 1, title: 'Toronto', ns: 0, text: "'''Toronto''' is the [[capital]] of [[Ontario]]. It has {{convert|2794356|people}}." },
  { id: 2, title: 'Anarchism', ns: 0, text: "'''Anarchism''' is a [[political philosophy]].\n\n==History==\nIt has a long history.\n[[Category:Political ideologies]]" },
  { id: 3, title: 'TO', ns: 0, text: '#REDIRECT [[Toronto]]', redirect: 'Toronto' },
]
// stream 2 - an article, a category page, an entity-encoded article
const pages2 = [
  { id: 4, title: 'Ontario', ns: 0, text: "'''Ontario''' is a province of [[Canada]]." },
  { id: 5, title: 'Category:Provinces', ns: 14, text: 'provinces of canada' },
  { id: 6, title: 'AT&T Building', ns: 0, text: "The '''AT&amp;T Building''' has a &lt;ref&gt;citation&lt;/ref&gt; and a [[fish]]." },
]

const streams = [
  bzip(header),
  bzip(pages1.map((p) => page(p.id, p.title, p.ns, p.text, p.redirect)).join('')),
  bzip(pages2.map((p) => page(p.id, p.title, p.ns, p.text, p.redirect)).join('')),
  bzip('</mediawiki>\n'),
]

// the index maps byte offsets → the pages inside each stream
const offset1 = streams[0].length
const offset2 = streams[0].length + streams[1].length
let index = ''
pages1.forEach((p) => (index += `${offset1}:${p.id}:${p.title}\n`))
pages2.forEach((p) => (index += `${offset2}:${p.id}:${p.title}\n`))

writeFileSync(path.join(dir, 'tinywiki-latest-pages-articles-multistream.xml.bz2'), Buffer.concat(streams))
writeFileSync(path.join(dir, 'tinywiki-latest-pages-articles-multistream-index.txt.bz2'), bzip(index))

// a scrap of a daily pageview_complete file, for testing the grep + join
const pageviews = [
  'en.wikipedia Toronto 1 desktop 337 A16B14',
  'en.wikipedia Toronto 1 mobile-web 620 A16B14', // wrong platform - filtered
  'en.wikipedia AT&T_Building 6 desktop 12 C4',
  'fr.wikipedia Toronto 1 desktop 99 D2', // wrong project - filtered
  'en.wiktionary Toronto 1 desktop 8 E1', // wrong project - filtered
].join('\n') + '\n'
writeFileSync(path.join(dir, 'pageviews-tiny-user.bz2'), bzip(pageviews))
console.log(`wrote tinywiki fixture: ${streams.reduce((n, s) => n + s.length, 0)} bytes, streams at [0, ${offset1}, ${offset2}]`)
