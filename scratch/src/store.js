import { proxy } from 'valtio'

// shared ui state, mutated from outside the ui
// workers: [{ label, percent, status }]
// backlog: queued items, shown against max
const store = proxy({
  workers: [],
  backlog: 0,
  max: 1200
})

export default store
