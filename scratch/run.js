import { tsImport } from 'tsx/esm/api'

// pretend to be the host app: start the ui, push progress into the store, then close it
const { default: start, store } = await tsImport('./src/render.js', import.meta.url)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ramp the backlog up past max, then drain it
const runBacklog = async function () {
  for (let n = 0; n <= 100; n += 1) {
    await sleep(60)
    store.backlog = Math.round(store.max * 1.25 * Math.sin((n / 100) * Math.PI))
  }
}

// add a worker to the store and step it to 100% at its own pace
const runWorker = async function (label, ms) {
  const worker = { label, percent: 0, status: 'running' }
  store.workers.push(worker)
  const i = store.workers.length - 1
  for (let n = 1; n <= 100; n += 1) {
    await sleep(ms / 10)
    store.workers[i].percent = n
    store.workers[i].status = Math.random() < 0.5 ? 'idle' : 'running'
  }
}

const ui = start()
await Promise.all([
  runBacklog(),
  runWorker('worker-1', 200),
  runWorker('worker-2', 350),
  runWorker('worker-3', 275),
  runWorker('worker-4', 150)
])
// linger a moment on 100%, then shut the ui down
await sleep(2000)
ui.close()
await ui.done
