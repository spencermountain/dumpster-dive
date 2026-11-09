import { proxy } from 'valtio'

// shared ui state: a copy of boss.state
const store = proxy({
  workers: [],
  files: [],
  totals: { pages: 0, skipped: 0, complete: 0, errors: 0 },
  writeQueue: { queueLength: 0, total: 0, completed: 0, errors: 0 },
  jobs: { total: 0, pending: 0, done: 0 },
  ending: false,
  finished: false
})

// copy a boss.state snapshot into the store
const sync = (state) => Object.assign(store, state)

export { sync }
export default store
