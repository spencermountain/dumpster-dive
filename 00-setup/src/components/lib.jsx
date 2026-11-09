import React from 'react'
import { Box } from 'ink'

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

export { Row, Col, Show }
