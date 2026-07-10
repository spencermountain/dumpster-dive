// the default writer - one json article per line, to stdout.
// `dumpster -y > enwiki.ndjson` is a real workflow, so we respect
// stdout's own backpressure instead of firing and forgetting.
const consoleWriter = {
  write(batch) {
    return new Promise((resolve) => {
      let ok = true
      for (let article of batch) {
        ok = process.stdout.write(JSON.stringify(article) + '\n')
      }
      if (ok) {
        resolve()
      } else {
        process.stdout.once('drain', resolve)
      }
    })
  },
}

export default consoleWriter
