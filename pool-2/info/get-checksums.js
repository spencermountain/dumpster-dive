// these files are used as indexes for the bzip2 files, and contain the SHA256 checksums for each file
// https://dumps.wikimedia.org/other/mediawiki_content_current/frwiki/2026-10-01/xml/bzip2/SHA256SUMS

const parseChecksums = function (text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash, file] = line.split(/\s+/, 2)
      const [, start, end] = file.match(/-p(\d+)p(\d+)\.xml\.bz2$/) ?? []
      return { hash, file, start: Number(start), end: Number(end) }
    })
    .sort((a, b) => a.start - b.start)
}

const makeUrl = function (opts) {
  const { project, lang, date, host } = opts
  let proj = project === 'wikipedia' ? `${lang}wiki` : `${lang}${project}`
  const url = `${host}/other/mediawiki_content_current/${proj}/${date}/xml/bzip2/SHA256SUMS`
  return url
}

const fetchChecksums = async function (opts) {
  const url = makeUrl(opts)
  const response = await fetch(url, { method: 'GET' })
  if (!response.ok) {
    throw new Error(`Failed to fetch checksums from ${url}`)
  }
  const text = await response.text()
  return parseChecksums(text)
}

export default fetchChecksums
