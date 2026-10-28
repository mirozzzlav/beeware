import { useId, type ComponentPropsWithoutRef } from 'react'
import FormField from './FormField'
import Icon from './Icon'

type SelectFieldProps = ComponentPropsWithoutRef<'select'> & {
  label: string
  hideLabel?: boolean
}

export default function SelectField({
  label,
  hideLabel,
  id,
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <FormField label={label} htmlFor={inputId} hideLabel={hideLabel}>
      <div className="select-control">
        <select id={inputId} {...props}>
          {children}
        </select>
        <Icon name="chevronDown" className="select-control-icon" />
      </div>
    </FormField>
  )
}
