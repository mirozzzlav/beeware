import type { ComponentProps, ReactNode } from 'react'
import { tokenVar, type ColorToken } from './design-tokens'

type ActionButtonProps = Omit<ComponentProps<'button'>, 'color'> & {
  color?: ColorToken
  icon?: ReactNode
  appearance?: 'outline' | 'filled'
}

export default function ActionButton({
  children,
  color,
  icon,
  appearance = 'outline',
  className,
  style,
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`action-button ${className ?? ''}`.trim()}
      data-appearance={appearance}
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
      {icon && (
        <span className="action-button-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}
