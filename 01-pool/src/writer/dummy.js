const defaultDelay = 1000

class WriterPlugin {
  constructor(delay = defaultDelay) {
    this.delay = delay
    this.written = 0
  }
  async init() {}
  async write(articles) {
    // Stand in for an awaited database bulk insert; nothing is persisted.
    await new Promise((resolve) => setTimeout(resolve, this.delay))
    this.written += articles.length
  }
  async close() {
    console.log(`  writer closed`)
  }
}

export default WriterPlugin
