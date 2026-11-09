import { proxy } from 'valtio'

const defaultState = {
  project: null, // wikipedia, wiktionary
  lang: null,
  namespaces: null, // { 0: true, 1: false } by namespace number
  source: null, // meta.wikimedia.org, local
  writer: null, // sqlite, duckdb
  // include: null, // {disambiguation, redirects}
  format: null // json, html
  // properties: null, // {summary, classification}
  // runtime: null //workers, chunks, resume
}
const order = Object.keys(defaultState)

export const store = proxy({
  userState: { ...defaultState },
  // getters
  get livePage() {
    return order.find((key) => this.userState[key] === null)
  },
  // one entry per dialogue page, for the pagination indicator
  get steps() {
    return order.map((key) => ({ key, done: this.userState[key] !== null }))
  },
  // actions
  // clear the previous answer so its page becomes live again
  // returns false when already on the first page
  goBack: () => {
    const i = order.indexOf(store.livePage)
    if (i <= 0) {
      return false
    }
    store.userState[order[i - 1]] = null
    return true
  }
})

export const resetStore = (initialState = {}) => {
  store.userState = { ...defaultState, ...structuredClone(initialState) }
}
