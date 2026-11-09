import startStream from './stream/index.js'
import Boss from './Boss.js'
import Writer from './writer/dummy.js'

// const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const startPool = async function (opts) {
  const stream = await startStream(opts)
  const boss = new Boss(opts, stream)
  const writer = new Writer()
  await writer.init()
  boss.startStream().catch((error) => console.error('pool error:', error))

  boss.on('results', (payload) => {
    writer.write(payload)
  })
  boss.on('done', (totals) => {
    console.log(totals)
    writer.close()
  })
  // await wait(1000)
  // console.log('====pausing==')
  // boss.pause()
  // await wait(2000)
  // console.log('====resuming==')
  // boss.resume()
  return stream
}

export default startPool
