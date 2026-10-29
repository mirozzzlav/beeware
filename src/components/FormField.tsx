import type { ReactNode } from 'react'
import type { ControlSize } from './control-size'

type FormFieldProps = {
  label: string
  description?: string
  htmlFor: string
  hideLabel?: boolean
  children: ReactNode
  size?: ControlSize
}

export default function FormField({
  label,
  description,
  htmlFor,
  hideLabel = false,
  size = 'normal',
  children,
}: FormFieldProps) {
  return (
    <div className="text-field" data-size={size}>
      <label htmlFor={htmlFor} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </label>
      {children}
      {description && (
        <p id={`${htmlFor}-description`} className="text-field-description">
          {description}
        </p>
      )}
    </div>
  )
}
