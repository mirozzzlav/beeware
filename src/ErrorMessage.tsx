import type { ReactNode } from 'react'
import Message from './Message'

export default function ErrorMessage({ children }: { children: ReactNode }) {
  return <Message variant="error">{children}</Message>
}
