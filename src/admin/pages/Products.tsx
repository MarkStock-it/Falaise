import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Collection, Product } from '../../api/types'
import { api, ApiError, downloadProductsCsv } from '../api'
import { money, relative } from '../format'
import { ProductEditor } from '../components/ProductEditor'
import {
  Badge,
  Button,
  Empty,
  Input,
  Panel,
  Select,
  Skeleton,
  useConfirm,
  useToast,
} from '../ui'

type StatusFilter = 'all' | 'active' | 'hidden' | 'sold_out'

function stockTone(product: Product): 'low' | 'out' | 'neutral' {
  if (product.status === 'sold_out' || (product.totalStock ?? 0) === 0) return 'out'
  if ((product.totalStock ?? 0) <= 3) return 'low'
  return 'neutral'
}

export function Products() {
  const toast = useToast()
  const confirm = useConfirm()
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const result = await api.get<{ products: Product[]; collections: Collection[] }>(
        '/api/admin/products',
      )
      setProducts(result.products)
      setCollections(result.collections)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Products could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((product) => {
      if (term) {
        const haystack = `${product.name} ${product.slug} ${product.code} ${product.collection?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (statusFilter !== 'all' && product.status !== statusFilter) return false
      if (collectionFilter !== 'all' && product.collectionId !== collectionFilter) return false
      return true
    })
  }, [products, search, statusFilter, collectionFilter])

  function openNew() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setEditorOpen(true)
  }

  async function duplicate(product: Product) {
    setBusyId(product.id)
    try {
      await api.post(`/api/admin/products/${product.id}/duplicate`)
      toast.push(`“${product.name}” duplicated as hidden.`)
      await load()
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Duplicate failed.', 'error')
    } finally {
      setBusyId('')
    }
  }

  async function remove(product: Product) {
    const ok = await confirm({
      title: `Delete “${product.name}”?`,
      body: `This removes the product, its colours, images and every variant stock record. Stock history stays in the log. This cannot be undone.`,
      confirmLabel: 'Delete product',
      tone: 'danger',
    })
    if (!ok) return
    setBusyId(product.id)
    try {
      await api.del(`/api/admin/products/${product.id}`)
      toast.push(`“${product.name}” deleted.`)
      await load()
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Delete failed.', 'error')
    } finally {
      setBusyId('')
    }
  }

  async function exportCsv() {
    try {
      await downloadProductsCsv()
      toast.push('Products CSV downloaded.')
    } catch (cause) {
      toast.push(cause instanceof Error ? cause.message : 'Export failed.', 'error')
    }
  }

  const filtersActive = search.trim() !== '' || statusFilter !== 'all' || collectionFilter !== 'all'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="label text-mute">Catalogue</p>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Products</h1>
          <p className="mt-2 text-[13px] text-mute">
            {products.length} total · {products.filter((p) => p.status === 'active').length} active ·{' '}
            {products.filter((p) => p.manualStatus === 'hidden').length} hidden
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button size="sm" onClick={openNew}>
            Add product
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_200px_200px]">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, code, collection…"
          aria-label="Search products"
        />
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          aria-label="Filter by status"
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

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <Panel>
          <Empty
            title="Products did not load"
            body={error}
            action={<Button onClick={() => { setLoading(true); void load() }}>Try again</Button>}
          />
        </Panel>
      ) : products.length === 0 ? (
        <Panel>
          <Empty
            title="No products yet."
            body="Add the first product and it appears on the storefront straight away."
            action={<Button onClick={openNew}>Add product</Button>}
          />
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <Empty
            title="Nothing matches."
            body="No product matches that search and filter combination."
            action={
              filtersActive ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setCollectionFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Panel>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto border border-line md:block">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Collection</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className={busyId === product.id ? 'opacity-60' : undefined}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-9 shrink-0 border border-line bg-paper-deep">
                          {product.colors[0]?.photos.front ? (
                            <img
                              src={product.colors[0].photos.front}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-[family-name:var(--font-label)] text-[14px] font-[550]">
                            {product.name}
                            {product.featured ? <span className="text-acid">●</span> : null}
                          </p>
                          <p className="label mt-1 text-mute">
                            {product.code || '—'} / {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-[13px]">{product.collection?.name ?? '—'}</td>
                    <td className="text-right font-[family-name:var(--font-label)] text-[13px] tabular-nums">
                      {money(product.price)}
                    </td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="tabular-nums">{product.totalStock ?? 0}</span>
                        {stockTone(product) !== 'neutral' ? (
                          <Badge tone={stockTone(product)}>
                            {stockTone(product) === 'out' ? 'out' : 'low'}
                          </Badge>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <Badge tone={product.status === 'active' ? 'ok' : product.status === 'hidden' ? 'neutral' : 'out'}>
                        {product.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="label whitespace-nowrap text-mute">{relative(product.updatedAt)}</td>
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="label border border-line px-2.5 py-1.5 transition-colors hover:border-ink"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicate(product)}
                          disabled={busyId === product.id}
                          className="label border border-transparent px-2 py-1.5 text-mute transition-colors hover:border-line hover:text-ink disabled:opacity-50"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          disabled={busyId === product.id}
                          className="label border border-transparent px-2 py-1.5 text-mute transition-colors hover:border-line hover:text-ink disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((product) => (
              <article key={product.id} className="border border-line bg-paper">
                <div className="flex gap-3 p-3">
                  <div className="h-20 w-16 shrink-0 border border-line bg-paper-deep">
                    {product.colors[0]?.photos.front ? (
                      <img
                        src={product.colors[0].photos.front}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-[family-name:var(--font-label)] text-[15px] font-[550]">
                          {product.name}
                        </p>
                        <p className="label mt-1 text-mute">
                          {product.code || '—'} · {product.collection?.name ?? 'No collection'}
                        </p>
                      </div>
                      <Badge tone={product.status === 'active' ? 'ok' : product.status === 'hidden' ? 'neutral' : 'out'}>
                        {product.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <p className="label tabular-nums">{money(product.price)}</p>
                      <p className="label text-mute">
                        {product.totalStock ?? 0} in stock
                        {stockTone(product) !== 'neutral' ? (
                          <span className="ml-2">
                            <Badge tone={stockTone(product)}>{stockTone(product)}</Badge>
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex divide-x divide-line border-t border-line">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="label flex-1 py-3 transition-colors hover:bg-paper-deep/60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicate(product)}
                    disabled={busyId === product.id}
                    className="label flex-1 py-3 text-mute transition-colors hover:bg-paper-deep/60 hover:text-ink"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(product)}
                    disabled={busyId === product.id}
                    className="label flex-1 py-3 text-mute transition-colors hover:bg-paper-deep/60 hover:text-ink"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <p className="text-[12px] leading-relaxed text-mute">
        Edits go live immediately. “Sold out” is derived from variant stock — set a status of hidden
        to keep a sold-out piece off the store entirely.
      </p>

      <ProductEditor
        open={editorOpen}
        product={editing}
        collections={collections}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false)
          void load()
        }}
      />
    </div>
  )
}
