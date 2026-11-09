import React, { useCallback, useEffect, useRef } from 'react'
import { Box, Text, useApp } from 'ink'
import { snapshot, subscribe, useSnapshot } from 'valtio'
import { store } from './store.js'
import useKeyboard from './keyboard.js'
import Page from './pages/Page.jsx'


const App = function ({ clear }) {
  const { livePage } = useSnapshot(store)
  const { exit } = useApp()
  const completed = useRef(false)
  const finish = useCallback(
    (state) => {
      clear?.()
      exit(state)
    },
    [clear, exit]
  )

  useKeyboard(finish)

  useEffect(() => {
    const complete = () => {
      if (store.livePage || completed.current) {
        return
      }
      completed.current = true
      const output = structuredClone(snapshot(store.userState))
      finish(output)
    }
    const unsubscribe = subscribe(store, complete)
    complete()
    return unsubscribe
  }, [finish])

  if (!livePage) return null
  return (
    <Box width="100%" overflow="hidden" flexDirection="column">
      <Box flexDirection="column" flexGrow={1} flexShrink={1} minHeight={0} overflow="hidden">
        <Page />
      </Box>
    </Box>
  )
}

export default App
