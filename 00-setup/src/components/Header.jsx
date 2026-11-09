import React from 'react'
import { Text, Box } from 'ink'
import { useSnapshot } from 'valtio'
import { store } from '../store.js'

// one-line page heading: `Step 1: Project - Select which project...`
const Header = ({ title, description }) => {
  const { steps, livePage } = useSnapshot(store)
  const num = steps.findIndex((step) => step.key === livePage) + 1
  return (
    <Box height={1} gap={1}>
      <Text color="white">Step {num}:</Text>
      <Text underline color="green">
        {title || ''}
      </Text>
      <Text dimColor>- {description || ''}</Text>
    </Box>
  )
}

export default Header
