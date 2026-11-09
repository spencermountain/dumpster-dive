import { fetch, Agent } from 'undici'
import getChecksums from './get-checksum.js'

 // frwiki-2026-10-01-p13159990p17639014.xml.bz2
const makeUrl = function (opts, file) {
  const { project, lang, date, host } = opts
  let proj = project === 'wikipedia' ? `${lang}wiki` : `${lang}${project}`
  const url = `${host}/other/mediawiki_content_current/${proj}/${date}/xml/bzip2/${file}`
  return url
}

const urlExists = async function (url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

const setupReader = async function (opts) {
  // these files give us the filenames
  let checksums = await getChecksums(opts)
  console.log('checksums', checksums)

  const url = makeUrl(opts, checksums[0].file)
  const exists = await urlExists(url)
  if (!exists) {
    console.error('URL not found', url)
    throw new Error('URL not found')
  }
  const response = await fetch(url, { dispatcher: new Agent({ bodyTimeout: 0 }) })
  return response.body
}
export default setupReader
