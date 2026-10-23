import { existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { DATA_DIR, UPLOAD_DIR, db } from './db.mjs'

/* ------------------------------------------------------------------- ustar */

function octal(value, length) {
  const text = Math.max(0, Math.floor(value)).toString(8)
  return `${'0'.repeat(Math.max(0, length - 1 - text.length))}${text}\0`
}

function tarHeader(name, size, mtime) {
  if (Buffer.byteLength(name) > 100) throw new Error(`Archive path is too long: ${name}`)
  const block = Buffer.alloc(512, 0)
  block.write(name, 0, 100, 'utf8')
  block.write(octal(0o644, 8), 100, 8, 'ascii')
  block.write(octal(0, 8), 108, 8, 'ascii')
  block.write(octal(0, 8), 116, 8, 'ascii')
  block.write(octal(size, 12), 124, 12, 'ascii')
  block.write(octal(mtime, 12), 136, 12, 'ascii')
  block.write('        ', 148, 8, 'ascii')
  block.write('0', 156, 1, 'ascii')
  block.write('ustar\0', 257, 6, 'ascii')
  block.write('00', 263, 2, 'ascii')

  let sum = 0
  for (const byte of block) sum += byte
  block.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii')
  return block
}

function padding(buffer) {
  const remainder = buffer.length % 512
  return remainder === 0 ? buffer : Buffer.concat([buffer, Buffer.alloc(512 - remainder, 0)])
}

function tarEntry(name, data, mtime) {
  return Buffer.concat([tarHeader(name, data.length, mtime), padding(data)])
}

/* ------------------------------------------------------------------ backup */

/**
 * VACUUM INTO writes a consistent copy of the database, WAL included, without
 * blocking readers. The snapshot is removed from the data directory once it has
 * been read into memory, so a finished archive leaves nothing behind.
 */
function snapshotDatabase() {
  const path = join(DATA_DIR, `.archive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`)
  db.prepare('VACUUM INTO ?').run(path)
  try {
    return readFileSync(path)
  } finally {
    unlinkSync(path)
  }
}

function uploadFiles() {
  if (!existsSync(UPLOAD_DIR)) return []
  return readdirSync(UPLOAD_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => ({ name: `uploads/${entry.name}`, path: join(UPLOAD_DIR, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * One gzipped tar holding the database and every uploaded image. This is the
 * file to keep off-site: the JSON export in the admin covers copy and
 * catalogue, but inquiries and images only exist here.
 */
export function backupArchive() {
  const now = new Date()
  const stamp = now.toISOString().slice(0, 10)
  const mtime = Math.floor(now.getTime() / 1000)
  const uploads = uploadFiles()
  const database = snapshotDatabase()

  const manifest = Buffer.from(
    `${JSON.stringify(
      {
        createdAt: now.toISOString(),
        database: 'falaise.db',
        uploads: uploads.map((file) => file.name),
        restore:
          'Stop the service, replace falaise.db and the uploads/ folder inside DATA_DIR, then start it again.',
      },
      null,
      2,
    )}\n`,
  )

  const parts = [tarEntry('falaise.db', database, mtime)]
  for (const file of uploads) parts.push(tarEntry(file.name, readFileSync(file.path), mtime))
  parts.push(tarEntry('manifest.json', manifest, mtime))
  parts.push(Buffer.alloc(1024, 0))

  return {
    buffer: gzipSync(Buffer.concat(parts), { level: 9 }),
    filename: `falaise-backup-${stamp}.tar.gz`,
  }
}
