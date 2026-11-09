import parsePage from './page.js'

const decoder = new TextDecoder('utf-8')

// parse one batch of xml bytes into article results, synchronously
const parseBatch = (buffer, opts) => {
  const text = decoder.decode(buffer)
  const pages = text.split('</page>')
  // Each complete page ends before the final split fragment.
  pages.pop()

  const counts = { pages: pages.length, skipped: 0, errors: 0, complete: 0 }
  const payload = []
  pages.forEach((page) => {
    // Skip any dump header before the opening page tag.
    const xml = page.slice(page.indexOf('<page>')) + '</page>'
    const res = parsePage(xml, opts)
    if (res.skipped === true) {
      counts.skipped += 1
    } else {
      counts.complete += 1
      payload.push(res)
    }
  })
  return { payload, counts }
}

export default parseBatch
