import type { ReactNode } from 'react'
import FormFooter from './FormFooter'

type PanelProps = {
  children: ReactNode
  error?: string
  actions?: ReactNode
  status?: ReactNode
  className?: string
  'aria-labelledby': string
}

export default function Panel({
  children,
  error,
  actions,
  status,
  className,
  'aria-labelledby': labelledBy,
}: PanelProps) {
  return (
    <section
      className={`panel ${className ?? ''}`.trim()}
      aria-labelledby={labelledBy}
    >
      {children}
      {(error || actions || status) && (
        <FormFooter
          className="panel-footer"
          error={error}
          status={status}
          actions={actions}
        />
      )}
    </section>
  )
}
