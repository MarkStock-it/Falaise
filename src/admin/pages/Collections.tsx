import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Collection } from '../../api/types'
import { api, ApiError } from '../api'
import {
  Badge,
  Button,
  Empty,
  Field,
  Input,
  Modal,
  Panel,
  Skeleton,
  TextArea,
  Toggle,
  useConfirm,
  useToast,
} from '../ui'

type Draft = { name: string; slug: string; description: string; visible: boolean }

const empty: Draft = { name: '', slug: '', description: '', visible: true }

export function Collections() {
  const toast = useToast()
  const confirm = useConfirm()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [draft, setDraft] = useState<Draft>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      const result = await api.get<{ collections: Collection[] }>('/api/admin/collections')
      setCollections(result.collections)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Collections could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function startCreate() {
    setEditing(null)
    setDraft(empty)
    setErrors({})
    setMessage('')
    setOpen(true)
  }

  function startEdit(collection: Collection) {
    setEditing(collection)
    setDraft({
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      visible: collection.visible,
    })
    setErrors({})
    setMessage('')
    setOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!draft.name.trim()) {
      setErrors({ name: 'Give the collection a name.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        description: draft.description.trim(),
        visible: draft.visible,
        position: editing?.position ?? collections.length,
      }
      if (editing) {
        await api.put(`/api/admin/collections/${editing.id}`, payload)
        toast.push('Collection saved.')
      } else {
        await api.post('/api/admin/collections', payload)
        toast.push('Collection created.')
      }
      setOpen(false)
      await load()
    } catch (cause) {
      if (cause instanceof ApiError) {
        setErrors(cause.fields ?? {})
        setMessage(cause.message)
      } else {
        setMessage('The collection could not be saved.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function move(collection: Collection, direction: -1 | 1) {
    const index = collections.findIndex((item) => item.id === collection.id)
    const target = index + direction
    if (target < 0 || target >= collections.length) return
    const next = [...collections]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setCollections(next)
    setReordering(true)
    try {
      const result = await api.post<{ collections: Collection[] }>('/api/admin/collections/reorder', {
        ids: next.map((entry) => entry.id),
      })
      setCollections(result.collections)
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Reorder failed.', 'error')
      await load()
    } finally {
      setReordering(false)
    }
  }

  async function remove(collection: Collection) {
    const ok = await confirm({
      title: `Delete “${collection.name}”?`,
      body:
        collection.productCount > 0
          ? `${collection.productCount} product${collection.productCount === 1 ? '' : 's'} will keep their records but lose this collection. This cannot be undone.`
          : 'This collection is empty. Deleting it cannot be undone.',
      confirmLabel: 'Delete collection',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.del(`/api/admin/collections/${collection.id}`)
      toast.push(`“${collection.name}” deleted.`)
      await load()
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Delete failed.', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="label text-mute">Catalogue</p>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Collections</h1>
          <p className="mt-2 text-[13px] text-mute">
            {collections.length} collection{collections.length === 1 ? '' : 's'} · order controls how
            they are listed.
          </p>
        </div>
        <Button size="sm" onClick={startCreate}>
          New collection
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-20" />
          ))}
        </div>
      ) : error ? (
        <Panel>
          <Empty
            title="Collections did not load"
            body={error}
            action={<Button onClick={() => { setLoading(true); void load() }}>Try again</Button>}
          />
        </Panel>
      ) : collections.length === 0 ? (
        <Panel>
          <Empty
            title="No collections."
            body="Collections group products on the store. Create one and assign products to it."
            action={<Button onClick={startCreate}>New collection</Button>}
          />
        </Panel>
      ) : (
        <ul className="space-y-2">
          {collections.map((collection, index) => (
            <li key={collection.id} className="border border-line bg-paper">
              <div className="flex flex-wrap items-start justify-between gap-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="label mt-1 w-6 shrink-0 text-mute tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-[family-name:var(--font-label)] text-[16px] font-[600]">
                        {collection.name}
                      </h2>
                      <Badge tone={collection.visible ? 'ok' : 'neutral'}>
                        {collection.visible ? 'Visible' : 'Hidden'}
                      </Badge>
                      <Badge>{collection.productCount} products</Badge>
                    </div>
                    <p className="label mt-1 text-mute">/{collection.slug}</p>
                    {collection.description ? (
                      <p className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-mute">
                        {collection.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <div className="mr-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(collection, -1)}
                      disabled={index === 0 || reordering}
                      aria-label={`Move ${collection.name} up`}
                      className="h-8 w-8 border border-line text-[13px] leading-none transition-colors hover:border-ink disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(collection, 1)}
                      disabled={index === collections.length - 1 || reordering}
                      aria-label={`Move ${collection.name} down`}
                      className="h-8 w-8 border border-line text-[13px] leading-none transition-colors hover:border-ink disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => startEdit(collection)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(collection)}>
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow={editing ? `Edit / ${editing.slug}` : 'New collection'}
        title={editing ? editing.name : 'Add a collection'}
        size="md"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="collection-form" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create collection'}
            </Button>
          </>
        }
      >
        <form id="collection-form" onSubmit={submit} className="space-y-4" noValidate>
          {message ? (
            <p className="border border-ink bg-paper-deep/50 px-3 py-2 text-[13px]" role="alert">
              {message}
            </p>
          ) : null}
          <Field label="Name" error={errors.name} htmlFor="collection-name">
            <Input
              id="collection-name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              invalid={Boolean(errors.name)}
              placeholder="Vol. 01"
              autoFocus
            />
          </Field>
          <Field label="Slug" hint="Leave blank to derive it from the name" htmlFor="collection-slug">
            <Input
              id="collection-slug"
              value={draft.slug}
              onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
              placeholder="vol-01"
            />
          </Field>
          <Field label="Description" htmlFor="collection-description">
            <TextArea
              id="collection-description"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              rows={3}
              placeholder="One tee, two colours, one run."
            />
          </Field>
          <Toggle
            checked={draft.visible}
            onChange={(next) => setDraft({ ...draft, visible: next })}
            label="Visible on the store"
            description="Hidden collections keep their products but are not listed."
          />
        </form>
      </Modal>
    </div>
  )
}
