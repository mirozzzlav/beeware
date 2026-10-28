import type { ReactNode } from 'react'
import FormFeedback from './FormFeedback'

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
        <footer className="panel-footer">
          {(error || status) && (
            <div className="panel-feedback">
              <FormFeedback error={error} status={status} appearance="plain" />
            </div>
          )}
          {actions && <div className="panel-actions">{actions}</div>}
        </footer>
      )}
    </section>
  )
}
