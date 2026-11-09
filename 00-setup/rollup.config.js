import { isAbsolute } from 'node:path'

export default {
  input: 'src/render.js',
  external: (id) => !id.startsWith('.') && !isAbsolute(id),
  jsx: 'react',
  output: {
    file: 'builds/app.js',
    format: 'es',
    sourcemap: false
  }
}
