import { tsImport } from 'tsx/esm/api'
import startPool from './index.js'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// the ui has jsx files, so tsx loads it
const { default: startUi, sync, showSummary } = await tsImport('./ui/render.js', import.meta.url)

const opts = {
  lang: 'af',
  project: 'wikipedia',
  date: '2026-10-01',
  // local files skip the download; .xml files skip the decoder
  // files: ['/Users/spencer/Desktop/afwiki-2026-10-01-p2p470034.xml.bz2'],
  // decoder: 'bzip2',
  maxQueue: 5,
  // stand-in for a database write
  writer: async (batch) => {
    await wait(20)
    return batch.length
  },
  // a writer plugin can add its own lines to the summary screen
  summary: async () => [['writer', 'dummy writer, nothing persisted']]
}

const boss = await startPool(opts)
// every change in the pool lands in the ui store
sync(boss.state)
boss.on('state', sync)

const ui = startUi(boss)
let quit = false
// finished, or ended early: replace the live page with the report
boss.on('done', async (state) => {
  ui.close({ clear: true })
  if (!quit) {
    const extra = opts.summary ? await opts.summary(state) : []
    await showSummary(state, opts, extra)
  }
})

// quitting the ui early stops the pool too, with no report
await ui.done
quit = true
if (!boss.closing) {
  await boss.close()
}
