import { EventEmitter } from 'node:events'

class Boss extends EventEmitter {
  constructor(opts) {
    super()
    this.status = {}
    this.opts = opts
    this.workers = []
  }
  init() {
    for (let i = 0; i < this.opts.workerCount || 2; i++) {
      let w = new Worker(new URL('./worker/index.js', import.meta.url), {
        type: 'module',
        workerData: this.opts
      })
      this.workers.push(w)
      w.on('message', this.handleMessage.bind(this))
      w.on('error', this.handleError.bind(this))
    }
  }
  handleMessage(msg) {
    console.log(msg)
  }
  handleError(err) {
    console.error(err)
  }
}

export default Boss
