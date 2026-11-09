import parseXml from './01-xml.js'
import wtf from 'wtf_wikipedia'

const parsePage = function (xml, opts) {
  const { id, ns, title, text } = parseXml(xml)
  // try to skip early
  if (!title || !text || !id) {
    return { skipped: true, reason: 'empty' }
  }
  // skip by namespace
  const namespaces = opts.namespaces || {}
  if (namespaces[ns] !== true) {
    return { skipped: true, reason: 'namespace' }
  }
  const doc = wtf(text)
  // if (!doc.isRedirect()) {
  //   return { skipped: true, reason: 'redirect' }
  // }
  const categories = doc.categories()
  return { id, ns, title, categories }
}

export default parsePage
