import type { ComponentProps, ReactNode } from 'react'
import Message from './Message'

type FormFeedbackProps = {
  error?: string
  status?: ReactNode
  appearance?: ComponentProps<typeof Message>['appearance']
}

export default function FormFeedback({
  error,
  status,
  appearance,
}: FormFeedbackProps) {
  if (!error && !status) return null
  return (
    <Message variant={error ? 'error' : 'success'} appearance={appearance}>
      {error || status}
    </Message>
  )
}
