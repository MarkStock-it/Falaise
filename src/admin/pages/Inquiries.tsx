import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Inquiry, SiteContent } from '../../api/types'
import { api, ApiError } from '../api'
import { relative } from '../format'
import {
  Badge,
  Button,
  Empty,
  Field,
  Input,
  Modal,
  Panel,
  Select,
  Skeleton,
  TextArea,
  useConfirm,
  useToast,
} from '../ui'

const STATUSES: Inquiry['status'][] = ['new', 'replied', 'closed']

type Draft = { name: string; contact: string; message: string; product: string; status: Inquiry['status'] }
const empty: Draft = { name: '', contact: '', message: '', product: '', status: 'new' }

export function Inquiries() {
  const toast = useToast()
  const confirm = useConfirm()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [content, setContent] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Inquiry['status']>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Inquiry | null>(null)
  const [draft, setDraft] = useState<Draft>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      const [result, contentResult] = await Promise.all([
        api.get<{ inquiries: Inquiry[] }>('/api/admin/inquiries?limit=100'),
        api.get<{ content: SiteContent }>('/api/admin/content'),
      ])
      setInquiries(result.inquiries)
      setContent(contentResult.content)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Inquiries could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return inquiries.filter((inquiry) => {
      if (statusFilter !== 'all' && inquiry.status !== statusFilter) return false
      if (!term) return true
      return `${inquiry.name} ${inquiry.contact} ${inquiry.message} ${inquiry.product}`
        .toLowerCase()
        .includes(term)
    })
  }, [inquiries, search, statusFilter])

  function startCreate() {
    setEditing(null)
    setDraft(empty)
    setErrors({})
    setMessage('')
    setOpen(true)
  }

  function startEdit(inquiry: Inquiry) {
    setEditing(inquiry)
    setDraft({
      name: inquiry.name,
      contact: inquiry.contact,
      message: inquiry.message,
      product: inquiry.product,
      status: inquiry.status,
    })
    setErrors({})
    setMessage('')
    setOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!draft.name.trim()) {
      setErrors({ name: 'Add a name or Instagram handle.' })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/api/admin/inquiries/${editing.id}`, draft)
        toast.push('Inquiry updated.')
      } else {
        await api.post('/api/admin/inquiries', draft)
        toast.push('Inquiry logged.')
      }
      setOpen(false)
      await load()
    } catch (cause) {
      if (cause instanceof ApiError) {
        setErrors(cause.fields ?? {})
        setMessage(cause.message)
      } else {
        setMessage('The inquiry could not be saved.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(inquiry: Inquiry, status: Inquiry['status']) {
    try {
      await api.put(`/api/admin/inquiries/${inquiry.id}`, {
        name: inquiry.name,
        contact: inquiry.contact,
        message: inquiry.message,
        product: inquiry.product,
        status,
      })
      setInquiries((current) =>
        current.map((item) => (item.id === inquiry.id ? { ...item, status } : item)),
      )
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Status change failed.', 'error')
    }
  }

  async function remove(inquiry: Inquiry) {
    const ok = await confirm({
      title: `Delete the note from “${inquiry.name}”?`,
      body: 'This removes the logged inquiry and its message. It does not affect any Instagram thread.',
      confirmLabel: 'Delete note',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.del(`/api/admin/inquiries/${inquiry.id}`)
      toast.push('Inquiry deleted.')
      await load()
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Delete failed.', 'error')
    }
  }

  const dmUrl = content?.links?.instagramDm ?? '#'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="label text-mute">Orders via DM</p>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Inquiries</h1>
          <p className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-mute">
            Checkout is an Instagram thread, so nothing arrives here automatically. Log a DM to keep
            who asked for what, and where it stands.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={dmUrl}
            target="_blank"
            rel="noreferrer"
            className="label inline-flex h-9 items-center gap-2 border border-line px-3 transition-colors hover:border-ink"
          >
            Open DM ↗
          </a>
          <Button size="sm" onClick={startCreate}>
            Log inquiry
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, handle, piece…"
          aria-label="Search inquiries"
        />
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status[0].toUpperCase() + status.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <Panel>
          <Empty
            title="Inquiries did not load"
            body={error}
            action={<Button onClick={() => { setLoading(true); void load() }}>Try again</Button>}
          />
        </Panel>
      ) : inquiries.length === 0 ? (
        <Panel>
          <Empty
            title="No inquiries yet."
            body="When someone DMs about a piece, log it here so the thread and its status stay findable."
            action={<Button onClick={startCreate}>Log the first inquiry</Button>}
          />
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <Empty title="Nothing matches." body="Try a different search or status." />
        </Panel>
      ) : (
        <ul className="space-y-2">
          {filtered.map((inquiry) => (
            <li key={inquiry.id} className="border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-[family-name:var(--font-label)] text-[15px] font-[600]">
                      {inquiry.name}
                    </h2>
                    <Badge tone={inquiry.status === 'new' ? 'low' : inquiry.status === 'replied' ? 'ok' : 'neutral'}>
                      {inquiry.status}
                    </Badge>
                    {inquiry.product ? <Badge>{inquiry.product}</Badge> : null}
                  </div>
                  {inquiry.contact ? (
                    <p className="label mt-1 text-mute">{inquiry.contact}</p>
                  ) : null}
                  {inquiry.message ? (
                    <p className="mt-2 max-w-[70ch] whitespace-pre-wrap text-[13px] leading-relaxed">
                      {inquiry.message}
                    </p>
                  ) : null}
                  <p className="label mt-2 text-mute">{relative(inquiry.created_at)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {inquiry.status !== 'replied' ? (
                    <Button variant="outline" size="sm" onClick={() => setStatus(inquiry, 'replied')}>
                      Mark replied
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setStatus(inquiry, 'closed')}>
                      Close
                    </Button>
                  )}
                  {inquiry.status === 'closed' ? (
                    <Button variant="outline" size="sm" onClick={() => setStatus(inquiry, 'new')}>
                      Reopen
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => startEdit(inquiry)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(inquiry)}>
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
        eyebrow={editing ? 'Edit inquiry' : 'New inquiry'}
        title={editing ? editing.name : 'Log a DM'}
        size="md"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="inquiry-form" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Log inquiry'}
            </Button>
          </>
        }
      >
        <form id="inquiry-form" onSubmit={submit} className="space-y-4" noValidate>
          {message ? (
            <p className="border border-ink bg-paper-deep/50 px-3 py-2 text-[13px]" role="alert">
              {message}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name or handle" error={errors.name} htmlFor="inquiry-name">
              <Input
                id="inquiry-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                invalid={Boolean(errors.name)}
                placeholder="@ana or Ana Reyes"
                autoFocus
              />
            </Field>
            <Field label="Contact" hint="Handle, email or phone" htmlFor="inquiry-contact">
              <Input
                id="inquiry-contact"
                value={draft.contact}
                onChange={(event) => setDraft({ ...draft, contact: event.target.value })}
                placeholder="@ana"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Piece / size" htmlFor="inquiry-product">
              <Input
                id="inquiry-product"
                value={draft.product}
                onChange={(event) => setDraft({ ...draft, product: event.target.value })}
                placeholder="Le Tee — Noir / M"
              />
            </Field>
            <Field label="Status" htmlFor="inquiry-status">
              <Select
                id="inquiry-status"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as Inquiry['status'] })}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status[0].toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Message / note" htmlFor="inquiry-message">
            <TextArea
              id="inquiry-message"
              value={draft.message}
              onChange={(event) => setDraft({ ...draft, message: event.target.value })}
              rows={5}
              placeholder="Asked for the blanc in L, waiting on shipping quote."
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
