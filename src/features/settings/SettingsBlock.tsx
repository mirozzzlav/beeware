import type { ComponentProps } from 'react'
import Block from '../../components/Block'

export default function SettingsBlock({
  className = '',
  ...props
}: ComponentProps<typeof Block>) {
  return <Block {...props} className={`settings-block ${className}`.trim()} />
}
