import { proxy } from 'valtio'

const defaultState = {
  project: null, // wikipedia, wiktionary
  lang: null,
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
  page: 0,
  // getters
  get doublePage() {
    return this.page * 2
  },
  get livePage() {
    return order.find((key) => this.userState[key] === null)
  },
  // actions
  nextPage: () => {
    store.page += 1
  }
})

export const resetStore = (initialState = {}) => {
  store.userState = { ...defaultState, ...structuredClone(initialState) }
  store.page = 0
}
