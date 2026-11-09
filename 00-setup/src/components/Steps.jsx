import React from 'react'
import { Text, Box } from 'ink'
import { useSnapshot } from 'valtio'
import { store } from '../store.js'

// horizontal pagination dots - ● done, ○ current (white), ○ upcoming (grey)
// the final confirm step is a ✓, green once reached
const Steps = () => {
  const { steps, livePage } = useSnapshot(store)
  const last = steps.length - 1
  return (
    <Box paddingLeft={2} gap={1} marginTop={1}>
      {steps.map((step, i) => {
        const isCurrent = step.key === livePage
        if (i === last) {
          const reached = isCurrent || step.done
          return (
            <Text key={step.key} bold={reached} color={reached ? 'green' : 'grey'}>
              ✓
            </Text>
          )
        }
        if (step.done) {
          return <Text key={step.key}>●</Text>
        }
        return (
          <Text key={step.key} bold={isCurrent} color={isCurrent ? 'white' : 'grey'}>
            ○
          </Text>
        )
      })}
    </Box>
  )
}

export default Steps
