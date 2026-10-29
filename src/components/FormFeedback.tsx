import type { ReactNode } from 'react'
import Message from './Message'

type FormFeedbackProps = {
  error?: string
  status?: ReactNode
}

export default function FormFeedback({ error, status }: FormFeedbackProps) {
  if (!error && !status) return null
  return (
    <Message variant={error ? 'error' : 'success'}>{error || status}</Message>
  )
}
