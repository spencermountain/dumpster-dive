import { tsImport } from 'tsx/esm/api'
import startPool from './index.js'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// the ui has jsx files, so tsx loads it
const { default: startUi, sync } = await tsImport('./ui/render.js', import.meta.url)

const opts = {
  lang: 'fr',
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
  }
}

const boss = await startPool(opts)
// every change in the pool lands in the ui store
sync(boss.state)
boss.on('state', sync)

const ui = startUi(boss)
boss.on('done', async () => {
  await wait(1500) // linger on 100%
  ui.close()
})

// quitting the ui early stops the pool too
await ui.done
if (!boss.closing) {
  await boss.close()
}
