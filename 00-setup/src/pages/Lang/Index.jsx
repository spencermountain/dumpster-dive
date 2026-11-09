import React from 'react'
import { Box, Text } from 'ink'
import { store } from '../../store.js'
import SinglePick from '../../components/SinglePick.jsx'
import langs from './langs.js'

const round = (num) => {
  if (num > 1_000_000) {
    let n = Math.round(num / 100_000) / 10
    return n.toLocaleString() + 'm'
  }
  if (num > 1_000) {
    let n = Math.round(num / 1_000)
    return n.toLocaleString() + 'k'
  }
  return num
}

const Page = () => {
  // language is chosen before the project, so counts are wikipedia article counts
  const list = langs.map((obj) => {
    return {
      id: obj.id,
      label: obj.id,
      description: obj.name + ' (' + round(obj.count) + ' pages)',
      isDefault: obj.id === 'en'
    }
  })
  let desc = 'Which language'
  return (
    <Box flexDirection="column">
      <SinglePick
        title="Language"
        description={desc}
        list={list}
        onSelect={(id) => (store.userState.lang = id)}
      />
    </Box>
  )
}

export default Page
