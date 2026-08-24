import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Btn({
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Chip({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent'
  children: ReactNode
}) {
  return <span className={`chip chip-${tone}`}>{children}</span>
}

export function Panel({
  title,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="panel-head">
          <h3>{title}</h3>
          {actions && <div className="panel-actions">{actions}</div>}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: string
  title: string
  hint?: string
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden>
        {icon}
      </div>
      <h4>{title}</h4>
      {hint && <p>{hint}</p>}
    </div>
  )
}

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
      <span className="progress-label">{clamped}%</span>
    </div>
  )
}
