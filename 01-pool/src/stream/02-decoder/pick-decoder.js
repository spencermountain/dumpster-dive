import { spawnSync } from 'node:child_process'

// sorted by preference
const decoders = [
  'lbzip2', //older parallel one
  'pbz2', //new parallel rust one
  'fbz', //another rust one
  'pbzip2', //only parallel when multi-stream
  'bzip2', //standard one
  'wasm', //bzip2-codec/wasm
  'javascript' //unbzip2-stream
]

const checkInstalled = (lib) => {
  if (lib === 'javascript' || lib === 'passthrough' || lib === 'wasm') {
    return true
  }
  const result = spawnSync(lib, ['--version'], { stdio: 'ignore' })
  return result.status === 0
}

// see what user has installed
const pickDecoder = (lib) => {
  // pick user-set decoder if available
  if (lib && checkInstalled(lib)) {
    return lib
  }
  const found = decoders.find((command) => {
    return checkInstalled(command)
  })
  return found || 'javascript'
}
export default pickDecoder

// console.log(pickDecoder())
