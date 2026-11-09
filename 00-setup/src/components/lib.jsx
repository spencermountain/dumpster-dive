import React, { useState } from 'react'
import { Box, Text } from 'ink'

const Row = ({ children }) => {
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="center">
      {children}
    </Box>
  )
}

const Col = ({ children }) => {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center">
      {children}
    </Box>
  )
}

const Show = ({ condition, fallback = null, children }) => {
  return condition ? <>{children}</> : <>{fallback}</>
}

// a non-checkable list row: 'show more' or 'Done'
const ActionRow = ({ label, isSelected, dim }) => {
  return (
    <Box gap={1} height={1}>
      <Text bold color="blue">
        {isSelected ? '❯' : ' '}
      </Text>
      <Text bold color={isSelected ? 'blue' : 'white'} dimColor={dim && !isSelected}>
        {label}
      </Text>
    </Box>
  )
}

// fold a long list to its first `collapseAt` rows, until expand() is called
// `startExpanded` forces it open (eg. when the default row would be hidden)
const useFold = (list, collapseAt, startExpanded = false) => {
  const [expanded, setExpanded] = useState(startExpanded || list.length <= collapseAt)
  const visible = expanded ? list : list.slice(0, collapseAt)
  return {
    expanded,
    expand: () => setExpanded(true),
    visible,
    hiddenCount: list.length - visible.length,
    moreIndex: expanded ? -1 : visible.length // index of the 'show more' row
  }
}

export { Row, Col, Show, ActionRow, useFold }
