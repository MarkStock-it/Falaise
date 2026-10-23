import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ActivityEntry } from '../../api/types'
import { api, ApiError } from '../api'
import { dateTime, relative } from '../format'
import { Badge, Button, Empty, Input, Panel, Select, Skeleton } from '../ui'

const ACTION_TONE: Record<string, 'ok' | 'low' | 'out' | 'neutral'> = {
  created: 'ok',
  updated: 'neutral',
  deleted: 'out',
  stock: 'low',
  uploaded: 'neutral',
  login: 'neutral',
  duplicated: 'neutral',
  reordered: 'neutral',
}

export function Activity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')

  const load = useCallback(async () => {
    try {
      setError('')
      const result = await api.get<{ entries: ActivityEntry[] }>('/api/admin/activity?limit=200')
      setEntries(result.entries)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Activity could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const actions = useMemo(() => [...new Set(entries.map((entry) => entry.action))].sort(), [entries])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (action !== 'all' && entry.action !== action) return false
      if (!term) return true
      return `${entry.summary} ${entry.entity} ${entry.action}`.toLowerCase().includes(term)
    })
  }, [entries, search, action])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="label text-mute">Audit</p>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Activity</h1>
          <p className="mt-2 text-[13px] text-mute">
            Every product edit, stock movement, upload and content save — newest first.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load() }}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search changes…"
          aria-label="Search activity"
        />
        <Select value={action} onChange={(event) => setAction(event.target.value)} aria-label="Filter by action">
          <option value="all">All actions</option>
          {actions.map((item) => (
            <option key={item} value={item}>
              {item[0].toUpperCase() + item.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-14" />
          ))}
        </div>
      ) : error ? (
        <Panel>
          <Empty
            title="Activity did not load"
            body={error}
            action={<Button onClick={() => { setLoading(true); void load() }}>Try again</Button>}
          />
        </Panel>
      ) : entries.length === 0 ? (
        <Panel>
          <Empty title="No activity yet." body="Edits, stock moves and uploads will be recorded here." />
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <Empty title="Nothing matches." body="Try a different search or action." />
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {filtered.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <Badge tone={ACTION_TONE[entry.action] ?? 'neutral'}>{entry.action}</Badge>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-snug">{entry.summary}</p>
                    <p className="label mt-1 text-mute">
                      {entry.entity}
                      {entry.entity_id ? ` / ${entry.entity_id.slice(0, 8)}` : ''} · {relative(entry.created_at)}
                    </p>
                  </div>
                </div>
                <p className="label shrink-0 text-mute">{dateTime(entry.created_at)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
