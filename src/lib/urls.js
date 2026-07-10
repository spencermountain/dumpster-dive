// wikimedia database names: 'en'+'wikipedia' → 'enwiki', 'fr'+'wiktionary' → 'frwiktionary'
const dbName = function (lang, project) {
  let suffix = project === 'wikipedia' ? 'wiki' : project
  return lang.replace(/-/g, '_') + suffix
}

const dumpUrl = function (opts) {
  let db = dbName(opts.lang, opts.project)
  return `https://dumps.wikimedia.org/${db}/${opts.date}/${db}-${opts.date}-pages-articles-multistream.xml.bz2`
}

const indexUrl = function (opts) {
  return dumpUrl(opts).replace(/-multistream\.xml\.bz2$/, '-multistream-index.txt.bz2')
}

// daily pageview files, e.g /other/pageview_complete/2026/2026-07/pageviews-20260702-user.bz2
const pageviewUrl = function (date) {
  let yyyy = date.getUTCFullYear()
  let mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  let dd = String(date.getUTCDate()).padStart(2, '0')
  return `https://dumps.wikimedia.org/other/pageview_complete/${yyyy}/${yyyy}-${mm}/pageviews-${yyyy}${mm}${dd}-user.bz2`
}

export { dbName, dumpUrl, indexUrl, pageviewUrl }
