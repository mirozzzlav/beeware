import type { ReactNode } from 'react'
import FormFeedback from './FormFeedback'

type FormFooterProps = {
  error?: string
  status?: ReactNode
  actions?: ReactNode
  className?: string
  contentClassName?: string
}

export default function FormFooter({
  error,
  status,
  actions,
  className = '',
  contentClassName,
}: FormFooterProps) {
  return (
    <footer className={`form-footer ${className}`.trim()}>
      <div className={contentClassName}>
        {(error || status) && (
          <div className="panel-feedback">
            <FormFeedback error={error} status={status} />
          </div>
        )}
        {actions && <div className="panel-actions">{actions}</div>}
      </div>
    </footer>
  )
}
