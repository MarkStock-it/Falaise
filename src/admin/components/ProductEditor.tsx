import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Collection, Product } from '../../api/types'
import { api, ApiError } from '../api'
import { Button, Field, Input, Modal, Select, TextArea, Toggle, useToast } from '../ui'
import { ImageField } from './ImageField'

type DraftColor = {
  id: string | null
  key: string
  name: string
  hex: string
  front: string
  back: string
  detail: string
}

type Draft = {
  name: string
  code: string
  tagline: string
  description: string
  details: string
  price: string
  collectionId: string
  status: 'active' | 'hidden'
  featured: boolean
  drop: string
  fabric: string
  fit: string
  made: string
  sizesInput: string
  colors: DraftColor[]
  stock: Record<string, string>
}

let colorCounter = 0
const newColorKey = () => `new-${Date.now().toString(36)}-${colorCounter++}`

function blankColor(): DraftColor {
  return { id: null, key: newColorKey(), name: '', hex: '#161616', front: '', back: '', detail: '' }
}

const emptyDraft: Draft = {
  name: '',
  code: '',
  tagline: '',
  description: '',
  details: '',
  price: '',
  collectionId: '',
  status: 'active',
  featured: false,
  drop: '',
  fabric: '',
  fit: '',
  made: '',
  sizesInput: 'S, M, L, XL',
  colors: [blankColor()],
  stock: {},
}

export function parseSizes(input: string): string[] {
  const out: string[] = []
  for (const raw of input.split(',')) {
    const size = raw.trim()
    if (size && !out.includes(size)) out.push(size)
  }
  return out
}

function draftFrom(product: Product | null): Draft {
  if (!product) return { ...emptyDraft, colors: [blankColor()], stock: {} }
  const colors: DraftColor[] = product.colors.map((color) => ({
    id: color.id,
    key: color.id,
    name: color.name,
    hex: color.hex,
    front: color.photos.front,
    back: color.photos.back,
    detail: color.photos.detail,
  }))
  const stock: Record<string, string> = {}
  for (const color of colors) {
    for (const size of product.sizes) {
      const variant = product.variants.find((item) => item.colorId === color.id && item.size === size)
      stock[`${color.key}|${size}`] = String(variant?.stock ?? 0)
    }
  }
  return {
    name: product.name,
    code: product.code,
    tagline: product.tagline,
    description: product.description,
    details: product.details.join('\n'),
    price: String(product.price),
    collectionId: product.collectionId ?? '',
    status: product.manualStatus === 'hidden' ? 'hidden' : 'active',
    featured: product.featured,
    drop: product.drop,
    fabric: product.meta.fabric,
    fit: product.meta.fit,
    made: product.meta.made,
    sizesInput: product.sizes.join(', '),
    colors: colors.length > 0 ? colors : [blankColor()],
    stock,
  }
}

export function ProductEditor({
  open,
  product,
  collections,
  onClose,
  onSaved,
}: {
  open: boolean
  product: Product | null
  collections: Collection[]
  onClose: () => void
  onSaved: (product: Product) => void
}) {
  const toast = useToast()
  const [draft, setDraft] = useState<Draft>(() => draftFrom(product))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraft(draftFrom(product))
    setErrors({})
    setMessage('')
  }, [open, product])

  const sizes = useMemo(() => parseSizes(draft.sizesInput), [draft.sizesInput])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  function setColor(index: number, patch: Partial<DraftColor>) {
    setDraft((current) => ({
      ...current,
      colors: current.colors.map((color, i) => (i === index ? { ...color, ...patch } : color)),
    }))
  }

  function addColor() {
    setDraft((current) => ({
      ...current,
      colors: [...current.colors, blankColor()],
    }))
  }

  function removeColor(index: number) {
    setDraft((current) => {
      const color = current.colors[index]
      const stock = { ...current.stock }
      for (const key of Object.keys(stock)) {
        if (key.startsWith(`${color.key}|`)) delete stock[key]
      }
      return { ...current, colors: current.colors.filter((_, i) => i !== index), stock }
    })
  }

  const stockKey = (color: DraftColor, size: string) => `${color.key}|${size}`

  const totalStock = sizes.reduce(
    (sum, size) =>
      sum +
      draft.colors.reduce((count, color) => {
        const n = Number(draft.stock[stockKey(color, size)] ?? 0)
        return count + (Number.isFinite(n) ? n : 0)
      }, 0),
    0,
  )

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!draft.name.trim()) next.name = 'Give the product a name.'
    const price = Number(draft.price.replace(/[^\d.]/g, ''))
    if (!Number.isFinite(price) || price < 0) next.priceCents = 'Enter a price of 0 or more.'

    if (sizes.length === 0) next.sizes = 'Add at least one size.'
    if (draft.colors.length === 0) next.colors = 'Add at least one colour.'

    draft.colors.forEach((color, index) => {
      if (!color.name.trim()) next[`colors.${index}.name`] = 'Colour name is required.'
      if (!color.front.trim()) next[`colors.${index}.front`] = 'A front image is required.'
    })

    for (const color of draft.colors) {
      for (const size of sizes) {
        const raw = draft.stock[stockKey(color, size)] ?? '0'
        const n = Number(raw)
        if (!Number.isInteger(n) || n < 0) {
          next.stock = 'Stock must be a whole number of 0 or more.'
        }
      }
    }

    return next
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    const localErrors = validate()
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      setMessage('Check the highlighted fields before saving.')
      return
    }

    const stock: Record<string, string> = {}
    draft.colors.forEach((color, index) => {
      for (const size of sizes) {
        stock[`${index}|${size}`] = draft.stock[stockKey(color, size)] ?? '0'
      }
    })

    const payload = {
      name: draft.name.trim(),
      code: draft.code.trim(),
      tagline: draft.tagline.trim(),
      description: draft.description.trim(),
      details: draft.details.split('\n').map((line) => line.trim()).filter(Boolean),
      priceCents: Math.round(Number(draft.price.replace(/[^\d.]/g, '')) * 100),
      collectionId: draft.collectionId || null,
      status: draft.status,
      featured: draft.featured,
      drop: draft.drop.trim(),
      fabric: draft.fabric.trim(),
      fit: draft.fit.trim(),
      made: draft.made.trim(),
      sizes,
      colors: draft.colors.map((color) => ({
        id: color.id,
        name: color.name.trim(),
        hex: color.hex,
        front: color.front.trim(),
        back: color.back.trim(),
        detail: color.detail.trim(),
      })),
      stock,
    }

    setSaving(true)
    try {
      const result = product
        ? await api.put<{ product: Product }>(`/api/admin/products/${product.id}`, payload)
        : await api.post<{ product: Product }>('/api/admin/products', payload)
      toast.push(product ? 'Product saved.' : `“${result.product.name}” added.`)
      onSaved(result.product)
    } catch (cause) {
      if (cause instanceof ApiError) {
        setErrors(cause.fields)
        setMessage(cause.message)
      } else {
        setMessage('The product could not be saved.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={product ? `Edit / ${product.slug}` : 'New product'}
      title={product ? product.name : 'Add a product'}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-8" noValidate>
        {message ? (
          <p className="border border-ink bg-paper-deep/50 px-3 py-2 text-[13px] leading-snug" role="alert">
            {message}
          </p>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <h3 className="label">Identity</h3>
            <span className="label text-mute">{totalStock} in stock</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name} htmlFor="product-name">
              <Input
                id="product-name"
                value={draft.name}
                onChange={(event) => set('name', event.target.value)}
                invalid={Boolean(errors.name)}
                placeholder="Le Tee"
                required
              />
            </Field>
            <Field label="Code" hint="Short reference shown on the store" htmlFor="product-code">
              <Input
                id="product-code"
                value={draft.code}
                onChange={(event) => set('code', event.target.value)}
                placeholder="001"
              />
            </Field>
          </div>

          <Field label="Tagline" htmlFor="product-tagline">
            <Input
              id="product-tagline"
              value={draft.tagline}
              onChange={(event) => set('tagline', event.target.value)}
              placeholder="Rise above the ordinary."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (₱)" error={errors.priceCents} htmlFor="product-price">
              <Input
                id="product-price"
                inputMode="decimal"
                value={draft.price}
                onChange={(event) => set('price', event.target.value)}
                invalid={Boolean(errors.priceCents)}
                placeholder="1890"
              />
            </Field>
            <Field label="Collection" htmlFor="product-collection">
              <Select
                id="product-collection"
                value={draft.collectionId}
                onChange={(event) => set('collectionId', event.target.value)}
              >
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" hint="Sold out is automatic at zero stock" htmlFor="product-status">
              <Select
                id="product-status"
                value={draft.status}
                onChange={(event) => set('status', event.target.value as 'active' | 'hidden')}
              >
                <option value="active">Active — visible</option>
                <option value="hidden">Hidden — not on store</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Drop label" htmlFor="product-drop">
              <Input
                id="product-drop"
                value={draft.drop}
                onChange={(event) => set('drop', event.target.value)}
                placeholder="VOL. 01"
              />
            </Field>
            <div className="pb-1">
              <Toggle
                checked={draft.featured}
                onChange={(next) => set('featured', next)}
                label="Featured"
                description="Leads the catalogue and the front page."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="label border-b border-line pb-2">Description</h3>
          <Field label="Story" error={errors.description} htmlFor="product-description">
            <TextArea
              id="product-description"
              value={draft.description}
              onChange={(event) => set('description', event.target.value)}
              rows={5}
              placeholder="How it is cut, how it wears."
            />
          </Field>
          <Field label="Details" hint="One line per detail" htmlFor="product-details">
            <TextArea
              id="product-details"
              value={draft.details}
              onChange={(event) => set('details', event.target.value)}
              rows={5}
              placeholder={'Heavyweight cotton jersey\nBoxy crop fit'}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Fabric" htmlFor="product-fabric">
              <Input
                id="product-fabric"
                value={draft.fabric}
                onChange={(event) => set('fabric', event.target.value)}
                placeholder="Heavyweight cotton"
              />
            </Field>
            <Field label="Fit" htmlFor="product-fit">
              <Input
                id="product-fit"
                value={draft.fit}
                onChange={(event) => set('fit', event.target.value)}
                placeholder="Boxy crop"
              />
            </Field>
            <Field label="Made" htmlFor="product-made">
              <Input
                id="product-made"
                value={draft.made}
                onChange={(event) => set('made', event.target.value)}
                placeholder="Limited run / Cebu"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <h3 className="label">Colours & images</h3>
            <Button type="button" variant="outline" size="sm" onClick={addColor}>
              Add colour
            </Button>
          </div>
          {errors.colors ? (
            <p className="text-[12px]" role="alert">
              {errors.colors}
            </p>
          ) : null}

          {draft.colors.map((color, index) => (
            <div key={color.key} className="border border-line p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="label text-mute">Colour {String(index + 1).padStart(2, '0')}</p>
                {draft.colors.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="label text-[10px] text-mute underline decoration-line underline-offset-4 hover:text-ink"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Name" error={errors[`colors.${index}.name`]}>
                  <Input
                    value={color.name}
                    onChange={(event) => setColor(index, { name: event.target.value })}
                    invalid={Boolean(errors[`colors.${index}.name`])}
                    placeholder="Noir"
                  />
                </Field>
                <Field label="Swatch">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : '#161616'}
                      onChange={(event) => setColor(index, { hex: event.target.value })}
                      aria-label={`${color.name || 'Colour'} swatch`}
                      className="h-10 w-12 cursor-pointer border border-line bg-paper"
                    />
                    <Input
                      value={color.hex}
                      onChange={(event) => setColor(index, { hex: event.target.value })}
                      invalid={Boolean(errors[`colors.${index}.hex`])}
                      className="font-mono text-[13px]"
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <ImageField
                  label="Front"
                  value={color.front}
                  onChange={(url) => setColor(index, { front: url })}
                  error={errors[`colors.${index}.front`]}
                  compact
                />
                <ImageField
                  label="Back"
                  value={color.back}
                  onChange={(url) => setColor(index, { back: url })}
                  compact
                />
                <ImageField
                  label="Detail"
                  value={color.detail}
                  onChange={(url) => setColor(index, { detail: url })}
                  compact
                />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h3 className="label border-b border-line pb-2">Sizes & stock</h3>
          <Field
            label="Sizes"
            hint="Comma separated. Removing a size removes its stock."
            error={errors.sizes}
            htmlFor="product-sizes"
          >
            <Input
              id="product-sizes"
              value={draft.sizesInput}
              onChange={(event) => set('sizesInput', event.target.value)}
              invalid={Boolean(errors.sizes)}
              placeholder="S, M, L, XL"
            />
          </Field>

          {errors.stock ? (
            <p className="text-[12px]" role="alert">
              {errors.stock}
            </p>
          ) : null}

          {sizes.length > 0 ? (
            <div className="overflow-x-auto border border-line">
              <table className="admin-table min-w-[420px]">
                <thead>
                  <tr>
                    <th>Colour</th>
                    {sizes.map((size) => (
                      <th key={size} className="text-right">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {draft.colors.map((color, colorIndex) => (
                    <tr key={color.key}>
                      <td>
                        <span className="flex items-center gap-2">
                          <span
                            className="block h-3 w-3 border border-ink/20"
                            style={{ backgroundColor: color.hex }}
                            aria-hidden="true"
                          />
                          <span className="font-[family-name:var(--font-label)] text-[13px]">
                            {color.name || `Colour ${colorIndex + 1}`}
                          </span>
                        </span>
                      </td>
                      {sizes.map((size) => (
                        <td key={size} className="text-right">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            aria-label={`${color.name || 'Colour'} ${size} stock`}
                            value={draft.stock[stockKey(color, size)] ?? '0'}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                stock: { ...current.stock, [stockKey(color, size)]: event.target.value },
                              }))
                            }
                            className="h-9 w-16 border border-line bg-paper px-2 text-right font-[family-name:var(--font-label)] text-[13px] tabular-nums outline-none focus:border-ink"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </form>
    </Modal>
  )
}
