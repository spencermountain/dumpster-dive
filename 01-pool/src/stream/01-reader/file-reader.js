import { access } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createReadStream } from 'node:fs'

const toPath = (source) => {
  if (source.startsWith('file:')) {
    return fileURLToPath(source)
  }
  return source
}

const fileExists = async (source) => {
  try {
    await access(toPath(source))
    return true
  } catch {
    return false
  }
}

const setupReader = async (opts) => {
  const fileUrl = pathToFileURL(opts.localFile).href
  if (!(await fileExists(fileUrl))) {
    throw new Error(`File not found: ${fileUrl}`)
  }
  return createReadStream(toPath(fileUrl))
}

export default setupReader
