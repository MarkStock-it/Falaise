import './env.mjs'
import express from 'express'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DATA_DIR, ROOT, UPLOAD_DIR, db, getContentMap, logActivity, nowIso, putContent } from './db.mjs'
import {
  bulkSetStock,
  createCollection,
  createInquiry,
  createProduct,
  deleteCollection,
  deleteInquiry,
  deleteProduct,
  duplicateProduct,
  getProduct,
  listActivity,
  listCollections,
  listInquiries,
  listProducts,
  listStockLog,
  overview,
  productsCsv,
  reorderCollections,
  setVariantStock,
  updateCollection,
  updateInquiry,
  updateProduct,
} from './repo.mjs'
import {
  ensureAdmin,
  clearLoginFailures,
  clearSessionCookie,
  createSessionToken,
  isAuthenticated,
  loginAllowed,
  recordLoginFailure,
  requireAuth,
  sameOrigin,
  sessionTokenFromRequest,
  setSessionCookie,
  setPassword,
  verifyPassword,
} from './auth.mjs'
import {
  CONTENT_KEYS,
  INQUIRY_STATUSES,
  decodeImageUpload,
  normalizeCollection,
  normalizeContent,
  normalizeInquiry,
  normalizeProduct,
  normalizeStock,
} from './validate.mjs'
import { exportBackup, restoreBackup } from './backup.mjs'

const DIST = join(ROOT, 'dist')

function parseLimit(value, fallback = 20) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 1), 200) : fallback
}

function fail(res, status, error, fields) {
  return res.status(status).json(fields && Object.keys(fields).length > 0 ? { error, fields } : { error })
}

export function createApp({ vite = null } = {}) {
  const app = express()
  app.disable('x-powered-by')
  // Hosted behind a TLS proxy (Render, Railway, Fly) the app must trust that one
  // hop, otherwise req.protocol stays http: req.secure never turns on and the
  // Origin check rejects real admin writes. Left off locally so a direct client
  // cannot spoof X-Forwarded-For into the login throttle.
  const trustProxy = process.env.TRUST_PROXY
  if (trustProxy) {
    app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy)
  }
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    next()
  })
  app.use(express.json({ limit: '9mb' }))

  // ---------------------------------------------------------------- public API
  app.get('/api/health', (req, res) => res.json({ ok: true, at: nowIso() }))

  app.get('/api/store', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.json({
      content: getContentMap(),
      collections: listCollections(),
      products: listProducts(),
      generatedAt: nowIso(),
    })
  })

  // ---------------------------------------------------------------- auth
  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || 'unknown'
    if (!loginAllowed(ip)) {
      return fail(res, 429, 'Too many attempts. Try again in a few minutes.')
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!verifyPassword(password)) {
      recordLoginFailure(ip)
      return fail(res, 401, 'That password is not right.')
    }
    clearLoginFailures(ip)
    setSessionCookie(req, res, createSessionToken())
    logActivity('login', 'admin', null, 'Admin signed in.')
    return res.json({ ok: true })
  })

  app.get('/api/admin/session', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.json({ authenticated: isAuthenticated(req) })
  })

  app.post('/api/admin/logout', (req, res) => {
    clearSessionCookie(req, res)
    res.json({ ok: true })
  })

  // Everything below needs a valid signed session cookie.
  const admin = express.Router()
  admin.use(sameOrigin)
  admin.use(requireAuth)

  admin.get('/overview', (req, res) => res.json(overview()))

  admin.post('/password', (req, res) => {
    const currentPassword =
      typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    if (!verifyPassword(currentPassword)) {
      return fail(res, 422, 'Check the highlighted fields.', {
        currentPassword: 'That is not the current password.',
      })
    }
    if (newPassword.length < 10) {
      return fail(res, 422, 'Check the highlighted fields.', {
        newPassword: 'Use at least 10 characters.',
      })
    }
    if (newPassword.length > 200) {
      return fail(res, 422, 'Check the highlighted fields.', {
        newPassword: 'Use 200 characters or fewer.',
      })
    }
    if (newPassword === currentPassword) {
      return fail(res, 422, 'Check the highlighted fields.', {
        newPassword: 'Choose a password different from the current one.',
      })
    }
    setPassword(newPassword)
    logActivity('updated', 'admin', null, 'Changed the admin password.')
    return res.json({ ok: true })
  })

  admin.get('/products', (req, res) => {
    res.json({
      products: listProducts({ includeHidden: true }),
      collections: listCollections({ includeHidden: true }),
    })
  })

  admin.post('/products', (req, res) => {
    const normalized = normalizeProduct(req.body)
    if (!normalized.ok) return fail(res, 422, 'Check the highlighted fields.', normalized.errors)
    return res.status(201).json({ product: createProduct(normalized.value) })
  })

  admin.put('/products/:id', (req, res) => {
    const normalized = normalizeProduct(req.body)
    if (!normalized.ok) return fail(res, 422, 'Check the highlighted fields.', normalized.errors)
    const product = updateProduct(req.params.id, normalized.value)
    if (!product) return fail(res, 404, 'Product not found.')
    return res.json({ product })
  })

  admin.delete('/products/:id', (req, res) => {
    const product = getProduct(req.params.id)
    if (!product) return fail(res, 404, 'Product not found.')
    deleteProduct(req.params.id)
    return res.json({ ok: true })
  })

  admin.post('/products/:id/duplicate', (req, res) => {
    const copy = duplicateProduct(req.params.id)
    if (!copy) return fail(res, 404, 'Product not found.')
    return res.status(201).json({ product: copy })
  })

  admin.get('/products.csv', (req, res) => {
    const stamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="falaise-products-${stamp}.csv"`)
    res.send(productsCsv())
  })

  admin.patch('/variants/:id', (req, res) => {
    const stock = normalizeStock(req.body?.stock)
    if (stock === null) return fail(res, 422, 'Stock must be a whole number of 0 or more.')
    const updated = setVariantStock(req.params.id, stock)
    if (!updated) return fail(res, 404, 'Variant not found.')
    return res.json({ variant: { id: updated.id, stock: updated.stock } })
  })

  admin.post('/stock/bulk', (req, res) => {
    const ids = Array.isArray(req.body?.variantIds)
      ? req.body.variantIds.filter((id) => typeof id === 'string')
      : []
    if (ids.length === 0) return fail(res, 422, 'Select at least one variant.')
    if (ids.length > 500) return fail(res, 422, 'Select 500 variants or fewer.')
    const mode = req.body?.mode === 'add' ? 'add' : 'set'
    const value = normalizeStock(req.body?.value)
    if (value === null) return fail(res, 422, 'Enter a whole number of 0 or more.')

    const updated = bulkSetStock(ids, mode, value)
    logActivity(
      'stock',
      'bulk',
      null,
      `Bulk ${mode === 'add' ? 'added' : 'set'} stock on ${updated.length} variant(s).`,
    )
    return res.json({ updated })
  })

  admin.get('/stock-log', (req, res) => {
    res.json({
      entries: listStockLog({
        limit: parseLimit(req.query.limit, 50),
        productId: typeof req.query.productId === 'string' ? req.query.productId : null,
      }),
    })
  })

  admin.get('/activity', (req, res) => {
    res.json({ entries: listActivity(parseLimit(req.query.limit, 30)) })
  })

  admin.get('/backup', (req, res) => {
    const stamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="falaise-backup-${stamp}.json"`)
    res.send(JSON.stringify(exportBackup(), null, 2))
  })

  admin.post('/restore', (req, res) => {
    const result = restoreBackup(req.body)
    if (!result.ok) return fail(res, 422, result.error)
    const { products, variants, contentSections } = result.counts
    logActivity(
      'restore',
      'backup',
      null,
      `Restored a backup: ${products} product(s), ${variants} variant(s), ${contentSections} content section(s).`,
    )
    return res.json(result)
  })

  admin.get('/collections', (req, res) => {
    res.json({ collections: listCollections({ includeHidden: true }) })
  })

  admin.post('/collections', (req, res) => {
    const normalized = normalizeCollection(req.body)
    if (!normalized.ok) return fail(res, 422, normalized.errors.name, normalized.errors)
    return res.status(201).json({ collection: createCollection(normalized.value) })
  })

  admin.put('/collections/:id', (req, res) => {
    const normalized = normalizeCollection(req.body)
    if (!normalized.ok) return fail(res, 422, normalized.errors.name, normalized.errors)
    const collection = updateCollection(req.params.id, normalized.value)
    if (!collection) return fail(res, 404, 'Collection not found.')
    return res.json({ collection })
  })

  admin.delete('/collections/:id', (req, res) => {
    if (!deleteCollection(req.params.id)) return fail(res, 404, 'Collection not found.')
    return res.json({ ok: true })
  })

  admin.post('/collections/reorder', (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => typeof id === 'string') : []
    if (ids.length === 0) return fail(res, 422, 'Nothing to reorder.')
    return res.json({ collections: reorderCollections(ids) })
  })

  admin.get('/content', (req, res) => res.json({ content: getContentMap() }))

  admin.put('/content/:key', (req, res) => {
    const key = req.params.key
    if (!CONTENT_KEYS.includes(key)) return fail(res, 404, 'Unknown content section.')
    const normalized = normalizeContent(req.body)
    if (!normalized.ok) return fail(res, 422, normalized.errors.content, normalized.errors)
    putContent(key, normalized.value)
    logActivity('updated', 'content', key, `Updated the “${key}” section.`)
    return res.json({ content: { [key]: normalized.value } })
  })

  admin.get('/inquiries', (req, res) => {
    res.json({ inquiries: listInquiries(parseLimit(req.query.limit, 50)) })
  })

  admin.post('/inquiries', (req, res) => {
    const normalized = normalizeInquiry(req.body)
    if (!normalized.ok) return fail(res, 422, normalized.errors.name, normalized.errors)
    return res.status(201).json({ inquiry: createInquiry(normalized.value) })
  })

  admin.put('/inquiries/:id', (req, res) => {
    const normalized = normalizeInquiry(req.body)
    if (!normalized.ok) return fail(res, 422, normalized.errors.name, normalized.errors)
    if (!INQUIRY_STATUSES.includes(normalized.value.status)) {
      return fail(res, 422, 'Unknown inquiry status.')
    }
    const inquiry = updateInquiry(req.params.id, normalized.value)
    if (!inquiry) return fail(res, 404, 'Inquiry not found.')
    return res.json({ inquiry })
  })

  admin.delete('/inquiries/:id', (req, res) => {
    if (!deleteInquiry(req.params.id)) return fail(res, 404, 'Inquiry not found.')
    return res.json({ ok: true })
  })

  admin.post('/uploads', (req, res) => {
    const decoded = decodeImageUpload(req.body)
    if (!decoded.ok) return fail(res, 422, decoded.error)
    const name = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.${decoded.ext}`
    writeFileSync(join(UPLOAD_DIR, name), decoded.buffer)
    logActivity('uploaded', 'image', name, 'Uploaded an image.')
    return res.status(201).json({ url: `/uploads/${name}` })
  })

  app.use('/api/admin', admin)

  // ---------------------------------------------------------------- pages
  function sendAdminHtml(req, res, file) {
    if (vite) {
      const template = readFileSync(join(ROOT, file), 'utf8')
      return vite.transformIndexHtml(req.originalUrl, template).then((html) => {
        res.status(200).setHeader('Content-Type', 'text/html').end(html)
      })
    }
    // The workspace path may contain dot-directories (e.g. .config on Windows);
    // send() blocks those by default, so allow them for these two known files.
    return res.sendFile(join(DIST, file), { dotfiles: 'allow' })
  }

  app.get('/admin.html', (req, res) => {
    if (!isAuthenticated(req)) return res.redirect(302, '/admin-login.html')
    res.setHeader('Cache-Control', 'no-store')
    return sendAdminHtml(req, res, 'admin.html')
  })

  app.get('/admin-login.html', (req, res) => {
    if (isAuthenticated(req)) return res.redirect(302, '/admin.html')
    res.setHeader('Cache-Control', 'no-store')
    return sendAdminHtml(req, res, 'admin-login.html')
  })

  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      fallthrough: false,
      maxAge: '7d',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  )

  if (vite) {
    app.use(vite.middlewares)
  } else {
    app.use(
      express.static(DIST, {
        index: false,
        maxAge: '1h',
        setHeaders: (res, path) => {
          if (/\.(woff2|webp|jpg|png|svg)$/.test(path)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          }
        },
      }),
    )
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next()
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next()
      if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next()
      const index = join(DIST, 'index.html')
      if (!existsSync(index)) {
        return res
          .status(500)
          .send('Store not built. Run `npm run build` first, or use `npm run dev`.')
      }
      return res.sendFile(index, { dotfiles: 'allow' })
    })
  }

  // Central error handler: malformed JSON, oversized payloads, missing uploads.
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error?.type === 'entity.too.large') {
      return fail(res, 413, 'That upload is too large (9 MB request limit).')
    }
    if (error?.status === 404) return fail(res, 404, 'Not found.')
    if (error instanceof SyntaxError) return fail(res, 400, 'Malformed JSON body.')
    console.error(error)
    return fail(res, 500, 'Something went wrong on the server.')
  })

  return app
}

export function start() {
  const port = Number(process.env.PORT || 8787)
  // Local runs stay on loopback; a container or PaaS needs the wildcard.
  const host = process.env.HOST || '127.0.0.1'
  ensureAdmin()
  const app = createApp()
  const server = app.listen(port, host, () => {
    const shown = host === '0.0.0.0' || host === '::' ? 'localhost' : host
    console.log(`\n  FALAISE store  http://${shown}:${port}`)
    console.log(`  Admin          http://${shown}:${port}/admin.html`)
    console.log(`  Data           ${DATA_DIR}\n`)
  })
  const shutdown = () => server.close(() => process.exit(0))
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  return server
}

if (process.argv[1] && process.argv[1].endsWith('index.mjs')) {
  start()
}
