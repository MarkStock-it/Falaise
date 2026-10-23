import { useCallback, useEffect, useState } from 'react'
import type { Overview } from '../../api/types'
import { api, downloadProductsCsv } from '../api'
import { relative } from '../format'
import { Badge, Button, Empty, Panel, PanelHeader, Skeleton, useToast } from '../ui'

function Stat({
  label,
  value,
  detail,
  alert,
}: {
  label: string
  value: number | string
  detail: string
  alert?: boolean
}) {
  return (
    <div className={`border p-4 sm:p-5 ${alert ? 'border-ink bg-acid' : 'border-line bg-paper'}`}>
      <p className="label text-mute">{label}</p>
      <p className="display mt-3 text-[clamp(2rem,5vw,3rem)] leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-[12px] leading-snug text-mute">{detail}</p>
    </div>
  )
}

function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}

export function Dashboard({ onNavigate }: { onNavigate: (key: string) => void }) {
  const toast = useToast()
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setError('')
      const overview = await api.get<Overview>('/api/admin/overview')
      setData(overview)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The dashboard could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function exportCsv() {
    try {
      await downloadProductsCsv()
      toast.push('Products CSV downloaded.')
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Export failed.', 'error')
    }
  }

  if (loading) return <Loading />

  if (error || !data) {
    return (
      <Panel>
        <Empty
          title="Dashboard unavailable"
          body={error || 'No data was returned.'}
          action={<Button onClick={() => { setLoading(true); void load() }}>Try again</Button>}
        />
      </Panel>
    )
  }

  const { counts, lowStock, recentStock, recentActivity, recentInquiries } = data
  const dmUrl = data.content?.links?.instagramDm || '#'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="label text-mute">Studio / Admin</p>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Today at FALAISE</h1>
          <p className="mt-2 text-[13px] text-mute">
            {counts.total} product{counts.total === 1 ? '' : 's'} · every edit publishes to the
            storefront immediately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('products')}>
            Add product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Products" value={counts.total} detail="All records, including hidden" />
        <Stat label="Active" value={counts.active} detail="Visible and in stock" />
        <Stat label="Hidden" value={counts.hidden} detail="Not shown on the store" />
        <Stat
          label="Sold out"
          value={counts.soldOut}
          detail={counts.lowStock > 0 ? `${counts.lowStock} variant${counts.lowStock === 1 ? '' : 's'} low on stock` : 'No low-stock variants'}
          alert={counts.soldOut > 0 || counts.lowStock > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Low stock"
            meta={`At or below ${data.threshold} pieces`}
            children={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('stock')}>
                Open stock
              </Button>
            }
          />
          {lowStock.length === 0 ? (
            <Empty title="Nothing running low." body="Every active variant has more than three pieces left." />
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 8).map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-[family-name:var(--font-label)] text-[14px] font-[550]">
                      {variant.product_name}
                    </p>
                    <p className="label mt-1 text-mute">
                      {variant.color_name} / {variant.size}
                    </p>
                  </div>
                  <Badge tone="low">{variant.stock} left</Badge>
                </li>
              ))}
              {lowStock.length > 8 ? (
                <li className="px-4 py-3 text-[12px] text-mute sm:px-5">
                  +{lowStock.length - 8} more in Stock.
                </li>
              ) : null}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent changes"
            meta="Stock movements and edits"
            children={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('activity')}>
                All activity
              </Button>
            }
          />
          {recentActivity.length === 0 ? (
            <Empty title="No changes yet." body="Edits, stock movements and uploads appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {recentActivity.slice(0, 7).map((entry) => (
                <li key={entry.id} className="px-4 py-3 sm:px-5">
                  <p className="text-[13px] leading-snug">{entry.summary}</p>
                  <p className="label mt-1 text-mute">{relative(entry.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent stock"
            meta="Old → new values"
            children={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('stock')}>
                Change log
              </Button>
            }
          />
          {recentStock.length === 0 ? (
            <Empty title="No stock changes." body="Use the +/- controls or bulk restock to move stock; every change is logged." />
          ) : (
            <ul className="divide-y divide-line">
              {recentStock.slice(0, 6).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-[family-name:var(--font-label)] text-[13px] font-[550]">
                      {entry.product_name} / {entry.color_name} / {entry.size}
                    </p>
                    <p className="label mt-1 text-mute">{relative(entry.created_at)}</p>
                  </div>
                  <p className="label shrink-0 tabular-nums">
                    {entry.old_stock} → <span className="text-ink">{entry.new_stock}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Orders & inquiries"
            meta="This store orders through Instagram DMs"
            children={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('inquiries')}>
                Open inbox
              </Button>
            }
          />
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <p className="text-[13px] leading-relaxed text-mute">
              There is no checkout, so no orders land in this database. Log a DM inquiry to keep the
              thread and its status in one place.
            </p>
            <a
              href={dmUrl}
              target="_blank"
              rel="noreferrer"
              className="label link-line mt-3 inline-flex text-ink"
            >
              Open Instagram DM ↗
            </a>
          </div>
          {recentInquiries.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-mute sm:px-5">
              No inquiries logged yet. Add one from the Inquiries tab.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recentInquiries.map((inquiry) => (
                <li key={inquiry.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-[family-name:var(--font-label)] text-[13px] font-[550]">
                      {inquiry.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-mute">
                      {inquiry.message || inquiry.product || 'No message'}
                    </p>
                  </div>
                  <Badge tone={inquiry.status === 'new' ? 'low' : 'neutral'}>{inquiry.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
