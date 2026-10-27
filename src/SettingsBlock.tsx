import { useId, type ReactNode } from 'react'

type SettingsBlockProps = {
  title: string
  description: string
  children: ReactNode
  className?: string
}

export default function SettingsBlock({
  title,
  description,
  children,
  className = '',
}: SettingsBlockProps) {
  const titleId = useId()
  const descriptionId = useId()
  return (
    <div
      className={`settings-block ${className}`.trim()}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId} className="settings-block-description">
        {description}
      </p>
      {children}
    </div>
  )
}
