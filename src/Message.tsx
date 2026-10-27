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
      <Icon
        name={variant === 'error' ? 'error' : 'submit'}
        className="message-icon"
      />
      <span>{children}</span>
    </div>
  )
}
