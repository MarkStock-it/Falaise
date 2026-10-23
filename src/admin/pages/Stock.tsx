import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Collection, Product, StockLogEntry, Variant } from '../../api/types'
import { api, ApiError } from '../api'
import { relative } from '../format'
import {
  Badge,
  Button,
  Empty,
  Input,
  Panel,
  PanelHeader,
  Select,
  Skeleton,
  Spinner,
  useConfirm,
  useToast,
} from '../ui'

type Row = {
  variant: Variant
  product: Product
  colorName: string
  colorHex: string
}

const LOW = 3

function StockInput({
  value,
  disabled,
  onCommit,
}: {
  value: number
  disabled: boolean
  onCommit: (next: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setDraft(String(value))
  }, [value])

  return (
    <input
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      onFocus={() => {
        focused.current = true
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        focused.current = false
        const next = Number(draft)
        if (!Number.isInteger(next) || next < 0) {
          setDraft(String(value))
          return
        }
        if (next !== value) onCommit(next)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          setDraft(String(value))
          event.currentTarget.blur()
        }
      }}
      aria-label="Stock for this variant"
      className="h-9 w-16 border border-line bg-paper px-2 text-right font-[family-name:var(--font-label)] text-[13px] tabular-nums outline-none focus:border-ink disabled:opacity-50"
    />
  )
}

export function Stock() {
  const toast = useToast()
  const confirm = useConfirm()
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [log, setLog] = useState<StockLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'sold_out'>('all')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [pending, setPending] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState<'set' | 'add'>('add')
  const [bulkValue, setBulkValue] = useState('10')
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      const [catalogue, logResult] = await Promise.all([
        api.get<{ products: Product[]; collections: Collection[] }>('/api/admin/products'),
        api.get<{ entries: StockLogEntry[] }>('/api/admin/stock-log?limit=40'),
      ])
      setProducts(catalogue.products)
      setCollections(catalogue.collections)
      setLog(logResult.entries)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Stock could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo<Row[]>(() => {
    return products.flatMap((product) =>
      product.variants.map((variant) => {
        const color = product.colors.find((item) => item.id === variant.colorId)
        return {
          variant,
          product,
          colorName: color?.name ?? '—',
          colorHex: color?.hex ?? '#161616',
        }
      }),
    )
  }, [products])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (term) {
        const haystack = `${row.product.name} ${row.product.collection?.name ?? ''} ${row.colorName} ${row.variant.size}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (statusFilter !== 'all' && row.product.status !== statusFilter) return false
      if (collectionFilter !== 'all' && row.product.collectionId !== collectionFilter) return false
      return true
    })
  }, [rows, search, statusFilter, collectionFilter])

  const selectedRows = filtered.filter((row) => selected.includes(row.variant.id))
  const allSelected = filtered.length > 0 && selectedRows.length === filtered.length

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleAll() {
    if (allSelected) {
      setSelected((current) => current.filter((id) => !filtered.some((row) => row.variant.id === id)))
    } else {
      setSelected((current) => [...new Set([...current, ...filtered.map((row) => row.variant.id)])])
    }
  }

  async function commit(row: Row, next: number) {
    if (next === row.variant.stock) return
    setPending((current) => [...current, row.variant.id])
    try {
      await api.patch(`/api/admin/variants/${row.variant.id}`, { stock: next })
      setProducts((current) =>
        current.map((product) => {
          if (product.id !== row.product.id) return product
          const variants = product.variants.map((variant) =>
            variant.id === row.variant.id
              ? { ...variant, stock: next, available: next > 0 }
              : variant,
          )
          const totalStock = variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0)
          return {
            ...product,
            variants,
            totalStock,
            status:
              product.manualStatus === 'hidden'
                ? 'hidden'
                : totalStock === 0
                  ? 'sold_out'
                  : 'active',
            updatedAt: new Date().toISOString(),
          }
        }),
      )
      setLog((current) => [
        {
          id: Date.now(),
          variant_id: row.variant.id,
          product_id: row.product.id,
          product_name: row.product.name,
          color_name: row.colorName,
          size: row.variant.size,
          old_stock: row.variant.stock ?? 0,
          new_stock: next,
          reason: 'manual',
          created_at: new Date().toISOString(),
        },
        ...current,
      ])
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Stock update failed.', 'error')
    } finally {
      setPending((current) => current.filter((id) => id !== row.variant.id))
    }
  }

  async function applyBulk() {
    const value = Number(bulkValue)
    if (!Number.isInteger(value) || value < 0) {
      toast.push('Enter a whole number of 0 or more.', 'error')
      return
    }
    if (selectedRows.length === 0) return
    const ok = await confirm({
      title: `${bulkMode === 'add' ? 'Add' : 'Set'} stock on ${selectedRows.length} variant${selectedRows.length === 1 ? '' : 's'}?`,
      body:
        bulkMode === 'add'
          ? `Adds ${value} piece${value === 1 ? '' : 's'} to each selected variant. Stock cannot go negative.`
          : `Sets every selected variant to exactly ${value}. This overwrites their current stock.`,
      confirmLabel: bulkMode === 'add' ? 'Add stock' : 'Set stock',
    })
    if (!ok) return

    setBulkBusy(true)
    try {
      await api.post('/api/admin/stock/bulk', {
        variantIds: selectedRows.map((row) => row.variant.id),
        mode: bulkMode,
        value,
      })
      toast.push(`Updated ${selectedRows.length} variant${selectedRows.length === 1 ? '' : 's'}.`)
      setSelected([])
      await load()
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Bulk update failed.', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="label text-mute">Inventory</p>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Stock</h1>
          <p className="mt-2 text-[13px] text-mute">
            {rows.length} variants · {rows.filter((row) => row.variant.stock === 0).length} sold out ·{' '}
            {rows.filter((row) => (row.variant.stock ?? 0) > 0 && (row.variant.stock ?? 0) <= LOW).length} low
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load() }}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_180px_180px]">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product, colour, size…"
          aria-label="Search stock"
        />
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          aria-label="Filter by product status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="sold_out">Sold out</option>
        </Select>
        <Select
          value={collectionFilter}
          onChange={(event) => setCollectionFilter(event.target.value)}
          aria-label="Filter by collection"
        >
          <option value="all">All collections</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </Select>
      </div>

      {selectedRows.length > 0 ? (
        <div className="sticky top-[104px] z-30 flex flex-wrap items-center gap-3 border border-ink bg-acid px-3 py-3 sm:top-[112px]">
          <p className="label">{selectedRows.length} selected</p>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Select
              value={bulkMode}
              onChange={(event) => setBulkMode(event.target.value as 'set' | 'add')}
              aria-label="Bulk mode"
              className="h-9 w-auto bg-paper"
            >
              <option value="add">Add</option>
              <option value="set">Set to</option>
            </Select>
            <Input
              type="number"
              min={0}
              step={1}
              value={bulkValue}
              onChange={(event) => setBulkValue(event.target.value)}
              aria-label="Bulk stock value"
              className="h-9 w-24 bg-paper text-right tabular-nums"
            />
            <Button size="sm" onClick={applyBulk} disabled={bulkBusy} className="bg-ink text-paper">
              {bulkBusy ? <Spinner /> : null} Apply
            </Button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="label text-[10px] underline decoration-ink/40 underline-offset-4"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-14" />
          ))}
        </div>
      ) : error ? (
        <Panel>
          <Empty
            title="Stock did not load"
            body={error}
            action={<Button onClick={() => { setLoading(true); void load() }}>Try again</Button>}
          />
        </Panel>
      ) : rows.length === 0 ? (
        <Panel>
          <Empty title="No variants to count." body="Add a product with sizes first; its variants appear here." />
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <Empty title="Nothing matches." body="Try a different search or clear the filters." />
        </Panel>
      ) : (
        <>
          <div className="hidden overflow-x-auto border border-line md:block">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all variants"
                      className="h-4 w-4 accent-ink"
                    />
                  </th>
                  <th>Product</th>
                  <th>Colour</th>
                  <th>Size</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Adjust</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const stock = row.variant.stock ?? 0
                  const isPending = pending.includes(row.variant.id)
                  return (
                    <tr key={row.variant.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(row.variant.id)}
                          onChange={() => toggle(row.variant.id)}
                          aria-label={`Select ${row.product.name} ${row.colorName} ${row.variant.size}`}
                          className="h-4 w-4 accent-ink"
                        />
                      </td>
                      <td>
                        <p className="font-[family-name:var(--font-label)] text-[13px] font-[550]">
                          {row.product.name}
                        </p>
                        <p className="label mt-0.5 text-mute">
                          {row.product.manualStatus === 'hidden' ? 'Hidden' : row.product.collection?.name ?? '—'}
                        </p>
                      </td>
                      <td>
                        <span className="flex items-center gap-2 text-[13px]">
                          <span
                            className="block h-2.5 w-2.5 border border-ink/20"
                            style={{ backgroundColor: row.colorHex }}
                            aria-hidden="true"
                          />
                          {row.colorName}
                        </span>
                      </td>
                      <td className="font-[family-name:var(--font-label)] text-[13px]">{row.variant.size}</td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => commit(row, Math.max(0, stock - 1))}
                            disabled={isPending || stock === 0}
                            aria-label={`Decrease ${row.product.name} ${row.colorName} ${row.variant.size}`}
                            className="h-9 w-9 border border-line text-[15px] leading-none transition-colors hover:border-ink disabled:opacity-30"
                          >
                            −
                          </button>
                          <StockInput
                            value={stock}
                            disabled={isPending}
                            onCommit={(next) => commit(row, next)}
                          />
                          <button
                            type="button"
                            onClick={() => commit(row, stock + 1)}
                            disabled={isPending}
                            aria-label={`Increase ${row.product.name} ${row.colorName} ${row.variant.size}`}
                            className="h-9 w-9 border border-line text-[15px] leading-none transition-colors hover:border-ink disabled:opacity-30"
                          >
                            +
                          </button>
                          {isPending ? <Spinner className="text-mute" /> : null}
                        </div>
                      </td>
                      <td>
                        {stock === 0 ? (
                          <Badge tone="out">Sold out</Badge>
                        ) : stock <= LOW ? (
                          <Badge tone="low">{stock} left</Badge>
                        ) : (
                          <Badge tone="ok">In stock</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {filtered.map((row) => {
              const stock = row.variant.stock ?? 0
              const isPending = pending.includes(row.variant.id)
              return (
                <article key={row.variant.id} className="border border-line bg-paper p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.variant.id)}
                        onChange={() => toggle(row.variant.id)}
                        aria-label={`Select ${row.product.name} ${row.colorName} ${row.variant.size}`}
                        className="mt-1 h-4 w-4 accent-ink"
                      />
                      <div>
                        <p className="font-[family-name:var(--font-label)] text-[14px] font-[550]">
                          {row.product.name}
                        </p>
                        <p className="label mt-1 flex items-center gap-1.5 text-mute">
                          <span
                            className="block h-2.5 w-2.5 border border-ink/20"
                            style={{ backgroundColor: row.colorHex }}
                            aria-hidden="true"
                          />
                          {row.colorName} / {row.variant.size}
                        </p>
                      </div>
                    </div>
                    {stock === 0 ? (
                      <Badge tone="out">Sold out</Badge>
                    ) : stock <= LOW ? (
                      <Badge tone="low">{stock} left</Badge>
                    ) : (
                      <Badge tone="ok">In stock</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => commit(row, Math.max(0, stock - 1))}
                      disabled={isPending || stock === 0}
                      aria-label="Decrease stock"
                      className="h-10 w-10 border border-line text-lg leading-none disabled:opacity-30"
                    >
                      −
                    </button>
                    <StockInput value={stock} disabled={isPending} onCommit={(next) => commit(row, next)} />
                    <button
                      type="button"
                      onClick={() => commit(row, stock + 1)}
                      disabled={isPending}
                      aria-label="Increase stock"
                      className="h-10 w-10 border border-line text-lg leading-none disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      <Panel>
        <PanelHeader title="Stock change log" meta="Every movement, newest first" />
        {log.length === 0 ? (
          <Empty title="No changes yet." body="Use +/- or bulk restock and the movement is recorded here with old and new values." />
        ) : (
          <ul className="divide-y divide-line">
            {log.map((entry) => {
              const delta = entry.new_stock - entry.old_stock
              return (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-label)] text-[13px] font-[550]">
                      {entry.product_name} / {entry.color_name} / {entry.size}
                    </p>
                    <p className="label mt-1 text-mute">
                      {relative(entry.created_at)} · {entry.reason}
                    </p>
                  </div>
                  <p className="label shrink-0 tabular-nums">
                    {entry.old_stock} → {entry.new_stock}
                    <span className={`ml-2 ${delta > 0 ? 'text-ink' : 'text-mute'}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
