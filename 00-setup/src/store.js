import { proxy } from 'valtio'

const defaultState = {
  project: null, // wikipedia, wiktionary
  lang: null,
  namespaces: null, // { 0: true, 4: true } by namespace number
  source: null, // meta.wikimedia.org, local
  writer: null, // sqlite, duckdb
  // include: null, // {disambiguation, redirects}
  format: null // json, html
  // properties: null, // {summary, classification}
  // runtime: null //workers, chunks, resume
}
const order = Object.keys(defaultState)
const CONFIRM = 'confirm' // final review page, kept out of userState

export const store = proxy({
  userState: { ...defaultState },
  confirmed: false,
  // getters
  get livePage() {
    const key = order.find((k) => this.userState[k] === null)
    if (key === undefined && this.confirmed === false) {
      return CONFIRM
    }
    return key
  },
  // one entry per dialogue page, for the pagination indicator
  get steps() {
    const steps = order.map((key) => ({ key, done: this.userState[key] !== null }))
    steps.push({ key: CONFIRM, done: this.confirmed })
    return steps
  },
  // actions
  confirm: () => {
    store.confirmed = true
  },
  // clear the previous answer so its page becomes live again
  // returns false when already on the first page
  goBack: () => {
    const live = store.livePage
    const i = live === CONFIRM ? order.length : order.indexOf(live)
    if (i <= 0) {
      return false
    }
    store.userState[order[i - 1]] = null
    return true
  }
})

export const resetStore = (initialState = {}) => {
  store.userState = { ...defaultState, ...structuredClone(initialState) }
  store.confirmed = false
}
