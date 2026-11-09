import { createElement } from 'react'
import { render } from 'ink'
import Home from './Home.jsx'
import { resetStore } from './store.js'

const dialogue = async function () {
  let app
  try {
    resetStore({})
    app = render(createElement(Home, { clear: () => app?.clear() }), {
      alternateScreen: false,
      exitOnCtrlC: true
    })
    return await app.waitUntilExit()
  } finally {
    app?.unmount()
    app?.cleanup()
  }
}
export default dialogue
