import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

type Variant = 'ink' | 'outline' | 'paper' | 'acid'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group inline-flex select-none items-center justify-center gap-3 whitespace-nowrap border font-[family-name:var(--font-label)] text-[11px] font-[550] uppercase tracking-[0.09em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40'

const variants: Record<Variant, string> = {
  ink: 'border-ink bg-ink text-paper hover:bg-ink-soft',
  outline: 'border-current bg-transparent text-current hover:bg-ink hover:text-paper',
  paper: 'border-paper bg-paper text-ink hover:bg-paper-deep',
  acid: 'border-acid bg-acid text-ink hover:bg-paper hover:border-paper',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({
  variant = 'ink',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

type ButtonLinkProps = {
  to?: string
  href?: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
  onClick?: () => void
  ariaLabel?: string
}

export function ButtonLink({
  to,
  href,
  variant = 'ink',
  size = 'md',
  className,
  children,
  onClick,
  ariaLabel,
}: ButtonLinkProps) {
  const classes = cn(base, variants[variant], sizes[size], className)

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={to ?? '/'} className={classes} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Link>
  )
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0 transition-transform duration-300 group-hover:translate-x-1', className)}
    >
      <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
