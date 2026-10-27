import type { ComponentProps, ReactNode } from 'react'
import tokens from './tokens.json'

type ActionButtonProps = Omit<ComponentProps<'button'>, 'color'> & {
  color?: Extract<keyof typeof tokens, `palette-${string}`>
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
            appearance === 'filled' ? tokens['palette-white'] : tokens[color],
          borderColor: tokens[color],
          outlineColor: tokens[color],
        }),
        ...(appearance === 'filled' && {
          backgroundColor: tokens[color ?? 'palette-blue-700'],
          color: tokens['palette-white'],
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
