import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { fileToDataUrl, uploadImage, validateImageFile } from '../api'
import { Field, Spinner } from '../ui'

export function ImageField({
  label,
  value,
  onChange,
  error,
  hint,
  compact = false,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  error?: string
  hint?: string
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const problem = validateImageFile(file)
    if (problem) {
      setUploadError(problem)
      return
    }
    setUploadError('')
    setUploading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      const url = await uploadImage(dataUrl)
      onChange(url)
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Field label={label} error={uploadError || error} hint={hint}>
      <div className={compact ? 'space-y-2' : 'flex gap-3'}>
        <div className="relative shrink-0 border border-line bg-paper-deep">
          {value ? (
            <img
              src={value}
              alt=""
              className={`${compact ? 'h-32 w-24' : 'h-24 w-20'} object-cover`}
              loading="lazy"
            />
          ) : (
            <div
              className={`flex ${compact ? 'h-32 w-24' : 'h-24 w-20'} items-center justify-center px-1 text-center`}
            >
              <span className="label text-[9px] text-mute">No image</span>
            </div>
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-paper/80">
              <Spinner className="text-ink" />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="/photos/tee-front.webp or /uploads/…"
            aria-label={`${label} URL`}
            className="h-9 w-full border border-line bg-paper px-2.5 font-[family-name:var(--font-label)] text-[12px] outline-none focus:border-ink"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFile}
              className="sr-only"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="label inline-flex h-8 items-center border border-line px-2.5 text-mute transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange('')}
                className="label inline-flex h-8 items-center px-1.5 text-mute transition-colors hover:text-ink"
              >
                Remove
              </button>
            ) : null}
            <span className="text-[10px] leading-tight text-mute">JPEG / PNG / WebP, 5 MB</span>
          </div>
        </div>
      </div>
    </Field>
  )
}
