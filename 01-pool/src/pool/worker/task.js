import parsePage from './parsePage/index.js'
import { sendPayload } from './send-msg.js'
const decoder = new TextDecoder('utf-8')

const doTask = (task, opts) => {
  const text = decoder.decode(task)
  const pages = text.split('</page>')

  // Each complete page ends before the final split fragment.
  pages.pop()

  const counts = {
    pages: pages.length,
    skipped: 0,
    errors: 0,
    complete: 0,
    reasons: {}
  }
  const payload = []
  pages.forEach((page) => {
    // Skip any dump header before the opening page tag.
    const xml = page.slice(page.indexOf('<page>')) + '</page>'
    // Process xml here.
    const res = parsePage(xml, opts)
    if (res.skipped === true) {
      counts.skipped += 1
      const reason = res.reason || 'unknown'
      counts.reasons[reason] = (counts.reasons[reason] || 0) + 1
    } else {
      counts.complete += 1
      payload.push(res)
    }
  })
  // console.log(pages.length + ' pages', counts)
  // return { done: true, counts, results: payload.length }
  // sendPayload(payload, counts)
  sendPayload(payload, counts)
  // return { payload, counts }
}

export default doTask
