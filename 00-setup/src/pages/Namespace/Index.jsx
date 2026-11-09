import React from 'react'
import { Box } from 'ink'
import { store } from '../../store.js'
import MultiPick from '../../components/MultiPick.jsx'
import namespaces from './namespaces.js'

const list = namespaces.map((obj) => {
  return {
    id: obj.id,
    label: obj.name,
    description: obj.description,
    isDefault: obj.isDefault === true
  }
})

const Page = () => {
  return (
    <Box flexDirection="column">
      <MultiPick
        title="Namespaces"
        description="Which kinds of pages to include"
        list={list}
        onDone={(obj) => (store.userState.namespaces = obj)}
      />
    </Box>
  )
}

export default Page
