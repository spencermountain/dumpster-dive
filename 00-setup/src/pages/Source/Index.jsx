import React from 'react'
import { Box, Text } from 'ink'
import { store } from '../../store.js'
import SinglePick from '../../components/SinglePick.jsx'

const list = [
  { label: '⬇ Download', id: 'wikimedia', description: 'from wikimedia.org', isDefault: true },
  { label: '📦 Local Dump', id: 'local', description: 'Use a local .gz file' },
  {
    label: 'Third-party Download ↗',
    id: 'third-party',
    description: 'd/l from another server'
  }
]

const Page = () => {
  return (
    <Box flexDirection="column">
      <SinglePick
        title="Source"
        description="Where the dump file should come from"
        list={list}
        onSelect={(id) => (store.userState.source = id)}
      />
    </Box>
  )
}

export default Page
