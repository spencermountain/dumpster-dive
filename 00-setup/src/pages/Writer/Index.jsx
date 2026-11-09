import React from 'react'
import { Box, Text } from 'ink'
import { store } from '../../store.js'
import SinglePick from '../../components/SinglePick.jsx'

const list = [
  {
    label: 'Filesystem',
    id: 'filesystem',
    description: 'Pages as individual files',
    isDefault: true
  },
  { label: 'DuckDb', id: 'duckdb', description: 'Pages as rows in DuckDb' },
  { label: 'Sqlite', id: 'sqlite', description: 'Pages as rows in Sqlite' },
  { label: 'None', id: 'none', description: 'Console-only' }
]

const Page = () => {
  return (
    <Box flexDirection="column">
      <SinglePick
        title="Writer"
        description="Where the output should be written"
        list={list}
        onSelect={(id) => (store.userState.writer = id)}
      />
    </Box>
  )
}

export default Page
