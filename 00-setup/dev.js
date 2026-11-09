import { tsImport } from 'tsx/esm/api'

let app

export default async function dialogue() {
  app ??= tsImport('./src/render.js', import.meta.url)
  const { default: run } = await app
  return await run()
}
