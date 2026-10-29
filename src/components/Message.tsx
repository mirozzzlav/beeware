import type { ReactNode } from 'react'
import Icon from './Icon'

type MessageProps = {
  children: ReactNode
  variant: 'error' | 'success'
}

export default function Message({ children, variant }: MessageProps) {
  return (
    <div
      className={`message message-${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className="message-icon" aria-hidden="true">
        <Icon name={variant === 'error' ? 'error' : 'submit'} />
      </span>
      <span className="message-content">{children}</span>
    </div>
  )
}
