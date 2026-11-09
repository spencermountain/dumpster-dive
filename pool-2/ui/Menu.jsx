import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'

// a short list of choices: up/down moves the cursor, enter picks
// items: [{ id, label, description, disabled }]
const Menu = function ({ items, onPick }) {
  const [cursor, setCursor] = useState(0)
  // the list can shrink between renders
  const index = Math.min(cursor, items.length - 1)

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor(Math.max(index - 1, 0))
    }
    if (key.downArrow) {
      setCursor(Math.min(index + 1, items.length - 1))
    }
    if (key.return && !items[index].disabled) {
      onPick(items[index].id)
    }
  })

  return (
    <Box flexDirection="column">
      {items.map((item, i) => {
        const isSelected = i === index
        return (
          <Box key={item.id} gap={1} height={1}>
            <Text bold color="blue">
              {isSelected ? '❯' : ' '}
            </Text>
            <Text bold color={isSelected ? 'blue' : 'white'} dimColor={!isSelected || item.disabled}>
              {item.label}
            </Text>
            <Text color="grey">{item.description ? `- ${item.description}` : ''}</Text>
          </Box>
        )
      })}
    </Box>
  )
}

export default Menu
