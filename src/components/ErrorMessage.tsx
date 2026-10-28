import type { ComponentProps } from 'react'
import Message from './Message'

export default function ErrorMessage(
  props: Omit<ComponentProps<typeof Message>, 'variant'>,
) {
  return <Message {...props} variant="error" />
}
