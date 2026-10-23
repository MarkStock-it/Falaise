import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Arrow, Button, ButtonLink } from '../components/ui/Button'
import { cartCount, cartSubtotal, useCart } from '../store/cart'
import { formatPrice } from '../data/products'
import { usePageMeta } from '../hooks/usePageMeta'
import { fillTokens } from '../lib/tokens'
import { useSite } from '../store/site'

export function Checkout() {
  const { data } = useSite()
  const content = data!.content
  const links = content.links
  const chrome = content.chrome
  const copy = content.checkout

  const tokens = { HANDLE: links.handle, CITY: content.site.city }
  const steps = content.order.checkoutSteps.map((step) => ({
    ...step,
    body: fillTokens(step.body, tokens),
  }))

  usePageMeta({
    title: 'Order on Instagram — FALAISE',
    description:
      'Send your FALAISE order in an Instagram message. We confirm stock, shipping and payment in the same thread. No checkout, no card details on this site.',
  })

  const lines = useCart((state) => state.lines)
  const clear = useCart((state) => state.clear)
  const subtotal = cartSubtotal(lines)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const summary = useMemo(() => {
    const items = lines.map(
      (line) =>
        `${line.qty} × ${line.name} — ${line.colorName} / ${line.size} — ${formatPrice(line.price * line.qty)}`,
    )

    return [
      fillTokens(content.order.dmIntro, tokens),
      '',
      ...items,
      '',
      `Subtotal: ${formatPrice(subtotal)}`,
      fillTokens(content.order.dmOutro, tokens),
    ].join('\n')
  }, [lines, subtotal, content.order.dmIntro, content.order.dmOutro, tokens.HANDLE, tokens.CITY])

  async function copySummary() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(summary)
      setCopyStatus('copied')
      return true
    } catch {
      setCopyStatus('failed')
      return false
    }
  }

  async function sendToInstagram() {
    await copySummary()
    window.open(links.instagramDm, '_blank', 'noopener,noreferrer')
  }

  if (lines.length === 0) {
    return (
      <div className="shell min-h-[70svh] pt-12 pb-24 sm:pt-20">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-5">
          <p className="label text-mute">{chrome.checkoutEmptyKicker}</p>
          <p className="label text-mute">{chrome.checkoutViaLabel}</p>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="display text-[clamp(3rem,11vw,7rem)]">{copy.emptyHeadline}</h1>
            <p className="lede mt-6 max-w-[30ch] text-mute">
              {data!.products.length === 0
                ? copy.emptyLedeNone
                : data!.products.length === 1
                  ? copy.emptyLedeSingle
                  : copy.emptyLedeMany}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink to="/shop">
                {chrome.shopCollectionLabel}
                <Arrow />
              </ButtonLink>
              <ButtonLink href={links.instagram} variant="outline" className="border-ink">
                Message {links.handle}
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-line p-7">
              <p
                aria-hidden="true"
                className="display text-[clamp(4rem,10vw,6rem)] leading-none text-mute"
              >
                00
              </p>
              <p className="label mt-6 text-mute">{chrome.checkoutCurrentBagLabel}</p>
              <p className="mt-2 font-[family-name:var(--font-label)] text-lg">
                {chrome.emptyBagValue}
              </p>
              <p className="mt-4 text-[13px] leading-relaxed text-mute">{copy.emptyCardNote}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shell pt-12 pb-24 sm:pt-16">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-5">
        <p className="label text-mute">{chrome.checkoutKicker}</p>
        <p className="label text-mute">{chrome.checkoutViaLabel}</p>
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h1 className="display display-tight text-[clamp(3rem,9vw,7rem)] leading-[0.85]">
            {copy.headline.map((line, index) => (
              <span key={`${line}-${index}`}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </h1>
          <p className="lede mt-6 max-w-[38ch]">{fillTokens(copy.lede, tokens)}</p>

          <ol className="mt-10 border-t border-line">
            {steps.map((step) => (
              <li
                key={step.index}
                className="grid gap-3 border-b border-line py-6 sm:grid-cols-[3rem_1fr] sm:gap-6"
              >
                <span className="label pt-1 text-mute">{step.index}</span>
                <div>
                  <h2 className="font-[family-name:var(--font-label)] text-[15px] font-[600]">
                    {step.title}
                  </h2>
                  <p className="mt-1.5 max-w-[48ch] text-[14px] leading-relaxed text-mute">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={sendToInstagram}>
              Open Instagram DM
              <Arrow />
            </Button>
            <Button variant="outline" size="lg" onClick={copySummary}>
              {copyStatus === 'copied' ? 'Summary copied' : 'Copy summary'}
            </Button>
          </div>

          <p className="mt-4 max-w-[52ch] text-[13px] leading-relaxed text-mute" aria-live="polite">
            {copyStatus === 'failed' ? copy.copyFailed : copy.copyHelp}
          </p>

          <details className="mt-10 border-t border-line pt-5">
            <summary className="label cursor-pointer select-none text-mute transition-colors hover:text-ink">
              {chrome.viewSummaryLabel}
            </summary>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words bg-paper-deep/50 p-5 font-[family-name:var(--font-label)] text-[12px] leading-relaxed">
              {summary}
            </pre>
          </details>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
            <ButtonLink to="/shop" onClick={clear} variant="outline" size="sm" className="border-ink">
              Start a new bag
            </ButtonLink>
            <Link to="/shop" className="label link-line text-mute">
              Back to the collection
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <aside
            aria-labelledby="summary-title"
            className="border border-line bg-paper-deep/45 p-5 sm:p-7 lg:sticky lg:top-24"
          >
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <h2 id="summary-title" className="label">
                {chrome.orderHeading}
              </h2>
              <span className="label tabular-nums text-mute">
                {String(cartCount(lines)).padStart(2, '0')} {copy.piecesLabel}
              </span>
            </div>

            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-4">
                  <div className="w-14 shrink-0 border border-line bg-paper">
                    <img
                      src={line.image}
                      alt={`${line.name} in ${line.colorName}`}
                      width={56}
                      height={70}
                      className="h-[70px] w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-label)] text-[14px] font-[600] leading-tight">
                        {line.name}
                      </p>
                      <p className="label mt-1 text-mute">
                        {line.colorName} / {line.size}
                      </p>
                      <p className="label mt-1 text-mute">
                        {chrome.qtyLabel} {line.qty}
                      </p>
                    </div>
                    <p className="label shrink-0 whitespace-nowrap tabular-nums">
                      {formatPrice(line.price * line.qty)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-3 border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="label text-mute">{chrome.shippingLabel}</dt>
                <dd className="label text-right">{content.shipping.checkoutLabel}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="label">{chrome.subtotalLabel}</dt>
                <dd className="font-[family-name:var(--font-label)] text-xl font-[600] tracking-tight tabular-nums">
                  {formatPrice(subtotal)}
                </dd>
              </div>
            </dl>

            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-mute">
              {content.shipping.checkoutNote}
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
