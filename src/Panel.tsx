import type { ReactNode } from 'react'
import ErrorMessage from './ErrorMessage'
import Message from './Message'

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
              {error ? (
                <ErrorMessage appearance="plain">{error}</ErrorMessage>
              ) : status ? (
                <Message variant="success" appearance="plain">
                  {status}
                </Message>
              ) : null}
            </div>
          )}
          {actions && <div className="panel-actions">{actions}</div>}
        </footer>
      )}
    </section>
  )
}
