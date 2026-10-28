import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react'

type BlockProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  title?: ReactNode
  description?: ReactNode
  descriptionId?: string
  tone?: 'subtle' | 'surface'
  padding?: 'sm' | 'md' | 'lg'
}

export default function Block({
  tone = 'subtle',
  padding = 'lg',
  className = '',
  title,
  description,
  descriptionId,
  children,
  role,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  ...props
}: BlockProps) {
  const id = useId()
  const titleId = `${id}-title`
  const helpId = descriptionId ?? `${id}-description`
  const hasTitle = title != null && title !== false
  const hasDescription = description != null && description !== false
  return (
    <div
      {...props}
      className={`block ${className}`.trim()}
      data-tone={tone}
      data-padding={padding}
      role={role ?? (hasTitle || hasDescription ? 'group' : undefined)}
      aria-labelledby={labelledBy ?? (hasTitle ? titleId : undefined)}
      aria-describedby={describedBy ?? (hasDescription ? helpId : undefined)}
    >
      {(hasTitle || hasDescription) && (
        <div className="block-heading">
          {hasTitle && (
            <h2 id={titleId} className="block-title">
              {title}
            </h2>
          )}
          {hasDescription && (
            <p id={helpId} className="block-description">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="block-content">{children}</div>
    </div>
  )
}
