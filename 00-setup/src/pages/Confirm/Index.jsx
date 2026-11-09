import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { useSnapshot } from 'valtio'
import { store } from '../../store.js'
import Header from '../../components/Header.jsx'
import namespaces from '../Namespace/namespaces.js'

const labels = {
  lang: 'Language',
  project: 'Project',
  format: 'Format',
  source: 'Source',
  namespaces: 'Namespaces',
  writer: 'Writer'
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

// blue cursor cell, shared by both action rows
const Cursor = ({ on }) => {
  return (
    <Text bold color="blue">
      {on ? '❯' : ' '}
    </Text>
  )
}

// final review of every answer, then a two-row list: begin or go back
const Page = () => {
  const { userState } = useSnapshot(store)
  const [index, setIndex] = useState(0) // 0 begin, 1 back
  useInput((input, key) => {
    if (key.upArrow) {
      setIndex(0)
    }
    if (key.downArrow) {
      setIndex(1)
    }
    if (key.return || key.rightArrow || input === ' ') {
      if (index === 0) {
        store.confirm()
      } else {
        store.goBack()
      }
    }
  })
  return (
    <Box flexDirection="column" paddingX={2} paddingBottom={2}>
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
        marginLeft={4}
      >
        {Object.keys(labels).map((key) => (
          <Box key={key} height={1}>
            <Text dimColor>{labels[key].padEnd(12)}</Text>
            <Text color="green">{format(key, userState[key])}</Text>
          </Box>
        ))}
        {/* begin*/}
        <Box gap={1} marginTop={1}>
          <Cursor on={index === 0} />
          <Text bold color="white" backgroundColor="blue">
            {' ✓ Begin '}
          </Text>
        </Box>
        {/* back*/}
        <Box gap={1} marginTop={1}>
          <Cursor on={index === 1} />
          <Text color="red" bold={index === 1}>
            ← back
          </Text>
        </Box>
      </Box>
    </Box>
  )
}

export default Page
