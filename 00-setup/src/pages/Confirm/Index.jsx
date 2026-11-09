import React from 'react'
import { Box, Text, useInput } from 'ink'
import { useSnapshot } from 'valtio'
import { store } from '../../store.js'
import { ActionRow } from '../../components/lib.jsx'
import Header from '../../components/Header.jsx'
import namespaces from '../Namespace/namespaces.js'

const labels = {
  project: 'Project',
  lang: 'Language',
  namespaces: 'Namespaces',
  source: 'Source',
  writer: 'Writer',
  format: 'Format'
}

// namespace ids -> names, eg. { 0: true, 4: true } -> 'Articles, Project'
const namespaceNames = (obj) => {
  const names = Object.keys(obj).map((id) => {
    const found = namespaces.find((ns) => String(ns.id) === id)
    return found ? found.name : id
  })
  return names.length > 0 ? names.join(', ') : 'none'
}

const format = (key, value) => {
  if (key === 'namespaces') {
    return namespaceNames(value)
  }
  return String(value)
}

// final review of every answer - enter/space/right confirms, left/esc goes back
const Page = () => {
  const { userState } = useSnapshot(store)
  useInput((input, key) => {
    if (key.return || key.rightArrow || input === ' ') {
      store.confirm()
    }
  })
  return (
    <Box flexDirection="column" padding={2}>
      <Header title="Confirm" description="Review your choices" />
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="grey"
        borderTop={false}
        borderLeft={true}
        borderBottom={false}
        borderRight={false}
        paddingLeft={3}
        paddingTop={1}
        paddingBottom={1}
        marginBottom={1}
        marginLeft={4}
      >
        {Object.keys(labels).map((key) => (
          <Box key={key} height={1}>
            <Text dimColor>{labels[key].padEnd(12)}</Text>
            <Text color="green">{format(key, userState[key])}</Text>
          </Box>
        ))}
        <Box marginTop={1}>
          <ActionRow label="Confirm" isSelected={true} />
        </Box>
        <Text dimColor>← back</Text>
      </Box>
    </Box>
  )
}

export default Page
