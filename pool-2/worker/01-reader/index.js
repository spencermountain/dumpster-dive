import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

const readFile = async function (path) {
  const { size } = await stat(path)
  return { stream: createReadStream(path), size }
}

const readUrl = async function (url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok || !response.body) {
    throw new Error(`${response.status} fetching ${url}`)
  }
  const size = Number(response.headers.get('content-length')) || null
  return { stream: response.body, size }
}

// a byte stream for one dump file, local or remote, with its size when known
const makeReader = function (job, signal) {
  if (job.path) {
    return readFile(job.path)
  }
  return readUrl(job.url, signal)
}

export default makeReader
