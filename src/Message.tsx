import type { ReactNode } from 'react'
import Icon from './Icon'
import Pill from './Pill'

type MessageProps = {
  children: ReactNode
  variant: 'error' | 'success'
}

export default function Message({ children, variant }: MessageProps) {
  return (
    <Pill
      className={`message message-${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
      icon={<Icon name={variant === 'error' ? 'error' : 'submit'} />}
    >
      {children}
    </Pill>
  )
}
