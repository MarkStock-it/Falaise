import { useRef, useState } from 'react'
import { ApiError, downloadBackup, restoreBackupFile } from '../api'
import { Button, Field, Input, Panel, useToast } from '../ui'

type Counts = {
  collections: number
  products: number
  colors: number
  variants: number
  contentSections: number
}

export function Backup() {
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [confirm, setConfirm] = useState('')
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Counts | null>(null)

  async function onExport() {
    setExporting(true)
    setError('')
    try {
      await downloadBackup()
      toast.push('Backup downloaded.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'The backup could not be downloaded.')
    } finally {
      setExporting(false)
    }
  }

  async function onRestore() {
    if (!file) return
    setRestoring(true)
    setError('')
    setResult(null)
    try {
      const restored = await restoreBackupFile(file)
      setResult(restored.counts)
      toast.push('Backup restored. The store is updated.')
      setFile(null)
      setConfirm('')
      if (fileInput.current) fileInput.current.value = ''
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'The backup could not be restored.')
    } finally {
      setRestoring(false)
    }
  }

  const ready = Boolean(file) && confirm.trim().toUpperCase() === 'RESTORE'

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <p className="label text-mute">Safety</p>
        <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Backup</h1>
        <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-mute">
          One JSON file holds the whole store: every product, colour, variant, stock count,
          collection and content section. Keep a copy before a season change, and restore it if an
          edit goes wrong.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="flex flex-col p-5">
          <div>
            <h2 className="display text-xl">Download</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-mute">
              Saves a dated file to your computer. It contains no customer data: inquiries, the
              admin password and the stock / activity history are left out on purpose.
            </p>
          </div>

          <dl className="mt-4 space-y-2 border-y border-line py-3 text-[12px]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="label text-mute">Included</dt>
              <dd className="text-right">Products, colours, variants, stock, collections, content</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="label text-mute">Excluded</dt>
              <dd className="text-right">Inquiries, password, secrets, logs</dd>
            </div>
          </dl>

          <Button className="mt-5 self-start" onClick={onExport} disabled={exporting}>
            {exporting ? 'Preparing…' : 'Download backup'}
          </Button>
        </Panel>

        <Panel className="flex flex-col p-5">
          <div>
            <h2 className="display text-xl">Restore</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-mute">
              Replaces the catalogue and every content section with the contents of the file.
              Inquiries, the admin password and both logs are kept.
            </p>
          </div>

          <div className="mt-4 space-y-4 border-t border-line pt-4">
            <Field
              label="Backup file"
              hint="A .json file produced by the Download button above."
            >
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setError('')
                  setResult(null)
                }}
                className="block w-full text-[13px] text-mute file:mr-3 file:h-9 file:border file:border-ink file:bg-ink file:px-3 file:font-[family-name:var(--font-label)] file:text-[11px] file:uppercase file:tracking-[0.08em] file:text-paper"
              />
            </Field>

            <Field
              label="Type RESTORE to confirm"
              hint="This cannot be undone from here — download a backup first."
            >
              <Input
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="RESTORE"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>

            <Button
              variant="outline"
              className="border-ink"
              onClick={onRestore}
              disabled={!ready || restoring}
            >
              {restoring ? 'Restoring…' : 'Restore from file'}
            </Button>
          </div>

          {result ? (
            <p
              role="status"
              className="mt-4 border border-ink bg-paper-deep/40 px-3 py-2 text-[13px]"
            >
              Restored {result.products} product{result.products === 1 ? '' : 's'},{' '}
              {result.colors} colour{result.colors === 1 ? '' : 's'}, {result.variants} variant
              {result.variants === 1 ? '' : 's'}, {result.collections} collection
              {result.collections === 1 ? '' : 's'} and {result.contentSections} content section
              {result.contentSections === 1 ? '' : 's'}.
            </p>
          ) : null}
        </Panel>
      </div>

      {error ? (
        <p role="alert" className="border border-ink px-4 py-3 text-[13px]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
