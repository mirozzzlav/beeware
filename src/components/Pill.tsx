import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type PillProps = {
  icon?: ReactNode
} & (
  | ({ as: 'button' } & ComponentPropsWithoutRef<'button'>)
  | ({ as?: 'div' } & ComponentPropsWithoutRef<'div'>)
)

export default function Pill({
  icon,
  children,
  className = '',
  ...props
}: PillProps) {
  const content = (
    <>
      {icon && (
        <span className="pill-leading-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="pill-content">{children}</span>
    </>
  )
  const classes = `pill ${className}`.trim()
  if (props.as === 'button') {
    const { as: Tag, ...buttonProps } = props
    return (
      <Tag {...buttonProps} className={classes}>
        {content}
      </Tag>
    )
  }
  const { as: Tag = 'div', ...divProps } = props
  return (
    <Tag {...divProps} className={classes}>
      {content}
    </Tag>
  )
}
