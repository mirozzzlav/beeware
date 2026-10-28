import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  htmlFor: string
  hideLabel?: boolean
  children: ReactNode
}

export default function FormField({
  label,
  htmlFor,
  hideLabel = false,
  children,
}: FormFieldProps) {
  return (
    <div className="text-field">
      <label htmlFor={htmlFor} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </label>
      {children}
    </div>
  )
}
