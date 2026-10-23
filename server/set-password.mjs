import './env.mjs'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { setPassword } from './auth.mjs'

const args = process.argv.slice(2)
let password = args[0]

if (!password) {
  const rl = createInterface({ input: stdin, output: stdout })
  password = await rl.question('New admin password (10+ characters): ')
  rl.close()
}

try {
  setPassword(password)
  console.log('Admin password updated. Existing sessions keep working until they expire.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
