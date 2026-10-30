import { useId } from 'react'
import type { ControlSize } from './control-size'

// Keep native controls linked to FormField's label and optional description.
export function useFieldControl({
  id,
  description,
  describedBy,
  className = '',
  size = 'normal',
}: {
  id?: string
  description?: string
  describedBy?: string
  className?: string
  size?: ControlSize
}) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  return {
    id: controlId,
    className: `control ${className}`.trim(),
    'data-size': size,
    'aria-describedby':
      [describedBy, description ? `${controlId}-description` : undefined]
        .filter(Boolean)
        .join(' ') || undefined,
  }
}
