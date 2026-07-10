import wtf from 'wtf_wikipedia'
import toJson from './fmt.js'

const titleReg = /<title>([\s\S]*?)<\/title>/
const nsReg = /<ns>(\d+)<\/ns>/
const idReg = /<id>(\d+)<\/id>/ // the first <id> is the page id (revision ids come later)
const redirectReg = /<redirect [^>]*\/>/
const textReg = /<text[^>]*>([\s\S]*?)<\/text>/

// undo the xml-entity encoding of the dump, in one pass.
// single-pass also means '&amp;lt;' correctly stays a literal '&lt;'
const entityReg = /&(?:quot|lt|gt|amp|#x[0-9a-fA-F]+|#\d+);/g
const named = { '&quot;': '"', '&lt;': '<', '&gt;': '>', '&amp;': '&' }
const decodeOne = function (m) {
  if (named[m] !== undefined) {
    return named[m]
  }
  let n = m[2] === 'x' || m[2] === 'X' ? parseInt(m.slice(3, -1), 16) : Number(m.slice(2, -1))
  if (Number.isFinite(n) === false || n < 0 || n > 0x10ffff) {
    return m // junk entity - a bad page must never throw
  }
  return String.fromCodePoint(n)
}
const decode = function (str) {
  if (str.indexOf('&') === -1) {
    return str // the common case - no entities at all
  }
  return str.replace(entityReg, decodeOne)
}

// one '<page>...</page>' xml blob in, one json article out.
// returns null for pages we're configured to skip.
const parsePage = function (xml, opts, stats) {
  let ns = Number((xml.match(nsReg) || [])[1] || 0)
  if (opts.namespaces.includes(ns) === false) {
    stats.skipped += 1
    return null
  }
  let isRedirect = redirectReg.test(xml)
  if (isRedirect) {
    stats.redirects += 1
    if (opts.redirects !== true) {
      return null
    }
  }
  let title = decode((xml.match(titleReg) || [])[1] || '')
  let id = Number((xml.match(idReg) || [])[1] || 0)
  let m = xml.match(textReg)
  let wikitext = m ? decode(m[1]) : ''
  try {
    let doc = wtf(wikitext)
    let output = toJson(doc, opts.fmt)
    return Object.assign(output, { title, id, ns, lang: opts.lang })
  } catch (e) {
    stats.errors += 1
    return null
  }
}

export { parsePage, decode }
