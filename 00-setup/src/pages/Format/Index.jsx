import React from 'react'
import { Box, Text } from 'ink'
import { store } from '../../store.js'
import SinglePick from '../../components/SinglePick.jsx'

const list = [
  { label: 'Json-sm', id: 'json-sm', description: 'Smaller json' },
  { label: 'Json-md', id: 'json-md', description: 'Medium json', isDefault: true },
  { label: 'Json-lg', id: 'json-lg', description: 'Larger json' },
  { label: 'Text', id: 'text', description: 'Cleaned plaintext' },
  { label: 'Html', id: 'html', description: 'Converted to HTML' },
  { label: 'Markdown', id: 'markdown', description: 'Converted to Markdown' }
]

const Page = () => {
  return (
    <Box flexDirection="column">
      <SinglePick
        title="Output Format"
        description="What shape should the output be in?"
        list={list}
        onSelect={(id) => (store.userState.format = id)}
      />
    </Box>
  )
}

export default Page
