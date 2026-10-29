import type { ComponentProps, ReactNode } from 'react'
import { tokenVar, type ColorToken } from '../design-tokens'
import Pill from './Pill'
import type { ControlSize } from './control-size'

type ActionButtonProps = Omit<ComponentProps<'button'>, 'color'> & {
  color?: ColorToken
  icon?: ReactNode
  appearance?: 'outline' | 'filled'
  size?: ControlSize
}

export default function ActionButton({
  children,
  color,
  icon,
  appearance = 'outline',
  size = 'normal',
  className,
  style,
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <Pill
      {...props}
      as="button"
      icon={icon}
      type={type}
      className={`control action-button ${className ?? ''}`.trim()}
      data-appearance={appearance}
      data-size={size}
      style={{
        ...style,
        ...(color && {
          color:
            appearance === 'filled'
              ? tokenVar('color-text-inverse')
              : tokenVar(color),
          borderColor: tokenVar(color),
          outlineColor: tokenVar(color),
        }),
        ...(appearance === 'filled' && {
          backgroundColor: tokenVar(color ?? 'color-action-primary'),
          color: tokenVar('color-text-inverse'),
        }),
      }}
    >
      {children}
    </Pill>
  )
}
