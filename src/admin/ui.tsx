import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ buttons */

type Variant = 'ink' | 'outline' | 'ghost' | 'danger' | 'acid'

const buttonBase =
  'inline-flex select-none items-center justify-center gap-2 border font-[family-name:var(--font-label)] text-[12px] font-[550] uppercase tracking-[0.08em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40'

const buttonVariants: Record<Variant, string> = {
  ink: 'border-ink bg-ink text-paper hover:bg-ink-soft',
  outline: 'border-line bg-transparent text-ink hover:border-ink',
  ghost: 'border-transparent text-mute hover:text-ink hover:border-line',
  danger: 'border-ink bg-transparent text-ink hover:bg-ink hover:text-paper',
  acid: 'border-ink bg-acid text-ink hover:bg-ink hover:text-paper',
}

const buttonSizes = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-5',
}

export function Button({
  variant = 'ink',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof buttonSizes }) {
  return (
    <button className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...props}>
      {children}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent',
        className,
      )}
    />
  )
}

/* ------------------------------------------------------------------- fields */

const control =
  'w-full border border-line bg-paper px-3 font-[family-name:var(--font-label)] text-[14px] text-ink outline-none transition-colors placeholder:text-mute/70 focus:border-ink disabled:opacity-50'

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="label mb-1.5 block text-mute">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] leading-snug text-ink" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] leading-snug text-mute">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(control, 'h-10', invalid && 'border-ink bg-paper-deep/40', className)} {...props} />
}

export function TextArea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(control, 'min-h-[92px] resize-y py-2 leading-relaxed', invalid && 'border-ink bg-paper-deep/40', className)}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, 'h-10 cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 border transition-colors',
          checked ? 'border-ink bg-ink' : 'border-line bg-paper',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-3 w-3 transition-[left,background-color]',
            checked ? 'left-[19px] bg-paper' : 'left-[3px] bg-mute',
          )}
        />
      </button>
      <span>
        <span className="block font-[family-name:var(--font-label)] text-[13px] font-[550]">{label}</span>
        {description ? <span className="mt-0.5 block text-[12px] leading-snug text-mute">{description}</span> : null}
      </span>
    </label>
  )
}

/* ------------------------------------------------------------------ surface */

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('border border-line bg-paper', className)}>{children}</section>
}

export function PanelHeader({
  title,
  meta,
  children,
}: {
  title: string
  meta?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
      <div>
        <h2 className="label text-ink">{title}</h2>
        {meta ? <p className="mt-1 text-[12px] text-mute">{meta}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

type Tone = 'neutral' | 'ok' | 'low' | 'out'

const tones: Record<Tone, string> = {
  neutral: 'border-line text-mute',
  ok: 'border-ink text-ink',
  low: 'border-ink bg-acid text-ink',
  out: 'border-ink bg-ink text-paper',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('label inline-flex h-5 items-center border px-1.5 text-[10px]', tones[tone])}>
      {children}
    </span>
  )
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="px-5 py-12 text-center sm:py-16">
      <p className="display text-[clamp(1.6rem,4vw,2.2rem)]">{title}</p>
      <p className="mx-auto mt-3 max-w-[42ch] text-[13px] leading-relaxed text-mute">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-paper-deep', className)} />
}

/* -------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'sheet'
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input,select,textarea,button:not([data-close])',
      )
      focusable?.focus()
    }, 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    sheet: 'max-w-[720px]',
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="admin-fade-in absolute inset-0 bg-ink/45"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'admin-sheet-in relative flex max-h-[92svh] w-full flex-col border border-line bg-paper',
          widths[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
          <div>
            {eyebrow ? <p className="label text-mute">{eyebrow}</p> : null}
            <h2 id="modal-title" className="display mt-1 text-2xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-close
            className="label flex h-8 items-center border border-line px-3 text-mute transition-colors hover:border-ink hover:text-ink"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-paper px-4 py-3 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- toast */

type Toast = { id: number; message: string; tone: 'ok' | 'error' }
type ToastApi = { push: (message: string, tone?: 'ok' | 'error') => void }
const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, tone: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'admin-fade-in pointer-events-auto max-w-[360px] border px-4 py-3 text-[13px] leading-snug',
              toast.tone === 'error' ? 'border-ink bg-paper text-ink' : 'border-ink bg-ink text-paper',
            )}
          >
            {toast.tone === 'error' ? (
              <span className="label mr-2 text-[10px] text-mute">Problem</span>
            ) : null}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

/* ------------------------------------------------------------------ confirm */

type ConfirmOptions = {
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
}
type ConfirmApi = (options: ConfirmOptions) => Promise<boolean>
const ConfirmContext = createContext<ConfirmApi | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null)

  const confirm = useCallback<ConfirmApi>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setRequest({ ...options, resolve })
      }),
    [],
  )

  const close = (value: boolean) => {
    request?.resolve(value)
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(request)}
        onClose={() => close(false)}
        eyebrow="Please confirm"
        title={request?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => close(false)}>
              {request?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={request?.tone === 'danger' ? 'ink' : 'ink'}
              onClick={() => close(true)}
              autoFocus
            >
              {request?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-mute">{request?.body}</p>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmApi {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used inside ConfirmProvider')
  return context
}
