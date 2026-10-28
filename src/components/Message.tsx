import type { ReactNode } from 'react'
import Icon from './Icon'
import Pill from './Pill'

type MessageProps = {
  children: ReactNode
  variant: 'error' | 'success'
  appearance?: 'plain' | 'outlined'
}

export default function Message({
  children,
  variant,
  appearance = 'outlined',
}: MessageProps) {
  return (
    <Pill
      className={`message message-${variant}`}
      data-appearance={appearance}
      role={variant === 'error' ? 'alert' : 'status'}
      icon={<Icon name={variant === 'error' ? 'error' : 'submit'} />}
    >
      {children}
    </Pill>
  )
}
