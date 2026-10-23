import './env.mjs'
import { createServer as createViteServer } from 'vite'
import { createApp } from './index.mjs'
import { ensureAdmin } from './auth.mjs'

const port = Number(process.env.PORT || 8787)
ensureAdmin()

const vite = await createViteServer({
  server: { middlewareMode: true, host: '127.0.0.1' },
  appType: 'spa',
})

const app = createApp({ vite })
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`\n  FALAISE store  http://127.0.0.1:${port}`)
  console.log(`  Admin          http://127.0.0.1:${port}/admin.html\n`)
})

const shutdown = () => {
  server.close()
  vite.close().finally(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
