import React from 'react'
import { Text, Box } from 'ink'
import { useSnapshot } from 'valtio'
import { store } from '../store.js'
import projects from '../pages/Project/projects.js'
import langs from '../pages/Lang/langs.js'
import namespaces from '../pages/Namespace/namespaces.js'

const sources = {
  wikimedia: 'from wikimedia.org',
  local: 'from a local dump',
  'third-party': 'from a third-party server'
}
const writers = {
  filesystem: '→ Filesystem',
  duckdb: '→ DuckDb',
  sqlite: '→ Sqlite',
  none: '→ console'
}

const nameOf = (list, id) => {
  const found = list.find((obj) => String(obj.id) === String(id))
  return found ? found.name : String(id)
}

// turn the answers so far into phrases, eg. ['English Wikipedia', 'Articles', ...]
const buildParts = (state) => {
  const parts = []
  // language and project merge into one phrase, eg. 'English Wikipedia'
  if (state.lang !== null) {
    parts.push(nameOf(langs, state.lang))
  }
  if (state.project !== null) {
    parts.push(nameOf(projects, state.project))
  }
  if (state.format !== null) {
    parts.push('as [' + state.format + ']')
  }
  if (state.source !== null) {
    parts.push(sources[state.source] || state.source)
  }
  if (state.namespaces !== null) {
    const names = Object.keys(state.namespaces).map((id) => nameOf(namespaces, id))
    parts.push(names.length > 0 ? names.join('/') : 'no pages')
  }
  if (state.writer !== null) {
    parts.push(writers[state.writer] || state.writer)
  }
  return parts
}

// one-line description of the selection so far, built up as pages complete
// each phrase is a dim-blue block on a grey background
const Summary = () => {
  const { userState } = useSnapshot(store)
  const parts = buildParts(userState)
  return (
    <Box paddingLeft={2} height={1} gap={1}>
      {parts.map((part, i) => (
        <Box key={i} gap={1}>
          {/* caret between phrases*/}
          {i > 0 ? <Text dimColor>❯</Text> : null}
          <Text color="blue" dimColor underline>
            {part}
          </Text>
        </Box>
      ))}
    </Box>
  )
}

export default Summary
