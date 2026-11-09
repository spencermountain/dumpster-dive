import { EventEmitter } from 'node:events'

class Worker extends EventEmitter {
  constructor(opts, stream) {
    this.w = new Worker(new URL('./worker/index.js', import.meta.url), {
      type: 'module',
      workerData: this.opts
    })
  }
}
