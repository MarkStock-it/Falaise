import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SiteContent } from '../../api/types'
import { api, ApiError } from '../api'
import { CONTENT_GROUPS } from '../contentSchema'
import type { ContentGroup, FieldDef } from '../contentSchema'
import { ImageField } from '../components/ImageField'
import { Button, Field, Input, Panel, Skeleton, TextArea, Toggle, useToast } from '../ui'

type GroupKey = ContentGroup['key']
type Json = Record<string, unknown> | unknown[]

function getPath(root: unknown, path: string): unknown {
  if (path === '') return root
  let current: unknown = root
  for (const part of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setPath<T>(root: T, path: string, value: unknown): T {
  if (path === '') return value as T
  const [head, ...rest] = path.split('.')
  const source = (root ?? {}) as Record<string, unknown>
  return {
    ...source,
    [head]: rest.length === 0 ? value : setPath(source[head], rest.join('.'), value),
  } as T
}

function LinesField({
  id,
  value,
  onChange,
  rows = 3,
}: {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  rows?: number
}) {
  const [text, setText] = useState(value.join('\n'))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(value.join('\n'))
  }, [value])

  return (
    <textarea
      id={id}
      value={text}
      rows={rows}
      onFocus={() => {
        focused.current = true
      }}
      onBlur={() => {
        focused.current = false
      }}
      onChange={(event) => {
        setText(event.target.value)
        onChange(event.target.value.split('\n'))
      }}
      className="w-full resize-y border border-line bg-paper px-3 py-2 font-[family-name:var(--font-label)] text-[14px] leading-relaxed outline-none focus:border-ink"
      placeholder="One line per row"
    />
  )
}

function ArrayField({
  id,
  field,
  value,
  onChange,
}: {
  id: string
  field: FieldDef
  value: Record<string, unknown>[]
  onChange: (next: Record<string, unknown>[]) => void
}) {
  const items = Array.isArray(value) ? value : []
  const itemFields = field.itemFields ?? []

  const update = (index: number, path: string, next: unknown) =>
    onChange(items.map((item, i) => (i === index ? setPath(item, path, next) : item)))

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  const add = () => {
    const blank: Record<string, unknown> = {}
    for (const itemField of itemFields) blank[itemField.path] = ''
    onChange([...items, blank])
  }

  return (
    <div id={id} className="space-y-2">
      {items.length === 0 ? (
        <p className="border border-dashed border-line px-3 py-6 text-center text-[12px] text-mute">
          Nothing here yet.
        </p>
      ) : null}

      {items.map((item, index) => (
        <div key={index} className="border border-line bg-paper p-3">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
            <p className="label text-mute">
              {String(index + 1).padStart(2, '0')} ·{' '}
              {field.itemTitle ? field.itemTitle(item) : `Item ${index + 1}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move item up"
                className="h-7 w-7 border border-line text-[12px] leading-none hover:border-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move item down"
                className="h-7 w-7 border border-line text-[12px] leading-none hover:border-ink disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="label h-7 border border-transparent px-2 text-[10px] text-mute hover:border-line hover:text-ink"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {itemFields.map((itemField) => (
              <Field
                key={itemField.path}
                label={itemField.label}
                className={itemField.type === 'textarea' ? 'sm:col-span-2' : undefined}
              >
                {itemField.type === 'textarea' ? (
                  <TextArea
                    value={String(item[itemField.path] ?? '')}
                    rows={3}
                    onChange={(event) => update(index, itemField.path, event.target.value)}
                  />
                ) : (
                  <Input
                    value={String(item[itemField.path] ?? '')}
                    onChange={(event) => update(index, itemField.path, event.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        {field.addLabel ?? 'Add item'}
      </Button>
    </div>
  )
}

export function Content() {
  const toast = useToast()
  const [content, setContent] = useState<SiteContent | null>(null)
  const [drafts, setDrafts] = useState<Record<string, unknown>>({})
  const [active, setActive] = useState<GroupKey>('hero')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const result = await api.get<{ content: SiteContent }>('/api/admin/content')
      setContent(result.content)
      setDrafts({})
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Site content could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const group = CONTENT_GROUPS.find((item) => item.key === active) ?? CONTENT_GROUPS[0]
  const stored = content ? (content[group.key] as unknown) : null
  const draft = (drafts[group.key] ?? stored ?? (group.key === 'stats' || group.key === 'testimonials' ? [] : {})) as unknown

  const dirty = useMemo(() => {
    if (!content) return false
    return JSON.stringify(draft) !== JSON.stringify(content[group.key])
  }, [content, draft, group.key])

  const dirtyKeys = useMemo(() => {
    if (!content) return new Set<string>()
    return new Set(
      CONTENT_GROUPS.filter(
        (item) =>
          drafts[item.key] !== undefined &&
          JSON.stringify(drafts[item.key]) !== JSON.stringify(content[item.key]),
      ).map((item) => item.key),
    )
  }, [content, drafts])

  function update(path: string, value: unknown) {
    setDrafts((current) => {
      const base = current[group.key] ?? stored ?? {}
      return { ...current, [group.key]: setPath(base as Json, path, value) }
    })
    setSaveError('')
  }

  async function save() {
    if (!content) return
    setSaving(true)
    setSaveError('')
    try {
      await api.put(`/api/admin/content/${group.key}`, draft as Record<string, unknown>)
      setContent((current) =>
        current ? ({ ...current, [group.key]: draft } as SiteContent) : current,
      )
      setDrafts((current) => {
        const next = { ...current }
        delete next[group.key]
        return next
      })
      toast.push(`“${group.label}” saved. The store is updated.`)
    } catch (cause) {
      setSaveError(cause instanceof ApiError ? cause.message : 'This section could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  function revert() {
    setDrafts((current) => {
      const next = { ...current }
      delete next[group.key]
      return next
    })
    setSaveError('')
  }

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]" aria-busy="true">
        <Skeleton className="h-96" />
        <Skeleton className="h-[520px]" />
      </div>
    )
  }

  if (error || !content) {
    return (
      <Panel className="p-6">
        <p className="label text-mute">Site content</p>
        <h1 className="display mt-3 text-2xl">Content did not load</h1>
        <p className="mt-2 text-[13px] text-mute">{error || 'No content was returned.'}</p>
        <Button className="mt-5" onClick={() => { setLoading(true); void load() }}>
          Try again
        </Button>
      </Panel>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="label text-mute">Storefront</p>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Site content</h1>
          <p className="mt-2 text-[13px] text-mute">
            Every word, image and link on the front page. Save a section to publish it.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="label inline-flex h-9 items-center gap-2 border border-line px-3 transition-colors hover:border-ink"
        >
          View store ↗
        </a>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_1fr] lg:gap-8">
        <nav
          aria-label="Content sections"
          className="min-w-0 max-w-full lg:sticky lg:top-[128px] lg:self-start"
        >
          <ul className="no-scrollbar -mx-1 flex max-w-full gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible">
            {CONTENT_GROUPS.map((item) => {
              const selected = item.key === group.key
              return (
                <li key={item.key} className="shrink-0 lg:border-b lg:border-line">
                  <button
                    type="button"
                    onClick={() => setActive(item.key)}
                    aria-current={selected ? 'true' : undefined}
                    className={`label flex h-9 items-center gap-2 whitespace-nowrap px-2 transition-colors lg:h-auto lg:w-full lg:justify-between lg:py-2.5 ${
                      selected ? 'bg-ink text-paper lg:bg-transparent lg:text-ink' : 'text-mute hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {dirtyKeys.has(item.key) ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-acid" aria-label="Unsaved changes" />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div>
                <h2 className="display text-2xl">{group.label}</h2>
                <p className="mt-1 max-w-[60ch] text-[12px] leading-relaxed text-mute">{group.blurb}</p>
              </div>
              <div className="flex items-center gap-2">
                {dirty ? (
                  <Button variant="ghost" size="sm" onClick={revert} disabled={saving}>
                    Revert
                  </Button>
                ) : null}
                <Button size="sm" onClick={save} disabled={saving || !dirty}>
                  {saving ? 'Saving…' : dirty ? 'Save section' : 'Saved'}
                </Button>
              </div>
            </div>

            {saveError ? (
              <p className="border-b border-line bg-paper-deep/60 px-4 py-2 text-[13px] sm:px-5" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-5">
              {group.fields.map((field, index) => {
                const id = `content-${group.key}-${index}`
                const value = getPath(draft, field.path)
                const wide = field.span === 2 || field.type === 'textarea' || field.type === 'list'

                if (field.type === 'boolean') {
                  return (
                    <div key={`${field.path}-${index}`} className="sm:col-span-2">
                      <Toggle
                        checked={Boolean(value)}
                        onChange={(next) => update(field.path, next)}
                        label={field.label}
                        description={field.help}
                      />
                    </div>
                  )
                }

                if (field.type === 'image') {
                  return (
                    <ImageField
                      key={`${field.path}-${index}`}
                      label={field.label}
                      value={String(value ?? '')}
                      onChange={(url) => update(field.path, url)}
                      hint={field.help}
                    />
                  )
                }

                if (field.type === 'list') {
                  return (
                    <div key={`${field.path}-${index}`} className="sm:col-span-2">
                      <p className="label mb-2 text-mute">{field.label}</p>
                      <ArrayField
                        id={id}
                        field={field}
                        value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
                        onChange={(next) => update(field.path, next)}
                      />
                    </div>
                  )
                }

                if (field.type === 'lines') {
                  return (
                    <Field key={`${field.path}-${index}`} label={field.label} hint={field.help} className={wide ? 'sm:col-span-2' : undefined}>
                      <LinesField
                        id={id}
                        value={Array.isArray(value) ? (value as string[]) : []}
                        onChange={(next) => update(field.path, next)}
                      />
                    </Field>
                  )
                }

                if (field.type === 'textarea') {
                  return (
                    <Field key={`${field.path}-${index}`} label={field.label} hint={field.help} className={wide ? 'sm:col-span-2' : undefined}>
                      <TextArea
                        id={id}
                        value={String(value ?? '')}
                        rows={field.rows ?? 3}
                        onChange={(event) => update(field.path, event.target.value)}
                      />
                    </Field>
                  )
                }

                return (
                  <Field key={`${field.path}-${index}`} label={field.label} hint={field.help}>
                    <Input
                      id={id}
                      value={String(value ?? '')}
                      onChange={(event) => update(field.path, event.target.value)}
                    />
                  </Field>
                )
              })}
            </div>
          </Panel>

          <p className="mt-3 text-[12px] leading-relaxed text-mute">
            Text fields accept the store’s own copy style: sentence case in the body, uppercase is
            applied by the design. Empty repeaters simply hide that part of the page.
          </p>
        </div>
      </div>
    </div>
  )
}
