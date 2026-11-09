const isProd = process.argv.includes('--production')
const entry = isProd ? './builds/app.js' : './dev.js'
const { default: dialogue } = await import(entry)

let output = await dialogue()
console.log(isProd ? 'prod' : 'dev', output)
