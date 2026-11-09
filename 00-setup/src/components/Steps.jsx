import React from 'react'
import { Text, Box } from 'ink'
import { useSnapshot } from 'valtio'
import { store } from '../store.js'

// horizontal pagination dots - ● done, ○ current (blue), ○ upcoming (dim)
const Steps = () => {
  const { steps, livePage } = useSnapshot(store)
  return (
    <Box width="100%" justifyContent="center" gap={1} marginTop={1}>
      {steps.map((step) => {
        if (step.done) {
          return <Text key={step.key}>●</Text>
        }
        const isCurrent = step.key === livePage
        return (
          <Text key={step.key} bold={isCurrent} color={isCurrent ? 'blue' : 'grey'} dimColor={!isCurrent}>
            ○
          </Text>
        )
      })}
    </Box>
  )
}

export default Steps
