import type { ComponentProps, ReactNode } from 'react'
import ActionButton from './ActionButton'

type FormActionsProps = {
  form: string
  busy: boolean
  cancelLabel: string
  submitLabel: string
  busyLabel: string
  onCancel: () => void | Promise<void>
  cancelIcon?: ReactNode
  submitIcon?: ReactNode
  submitColor?: ComponentProps<typeof ActionButton>['color']
  submitAppearance?: ComponentProps<typeof ActionButton>['appearance']
  submitFirst?: boolean
}

export default function FormActions({
  form,
  busy,
  cancelLabel,
  submitLabel,
  busyLabel,
  onCancel,
  cancelIcon,
  submitIcon,
  submitColor,
  submitAppearance,
  submitFirst = false,
}: FormActionsProps) {
  const cancelButton = (
    <ActionButton
      icon={cancelIcon}
      onClick={() => {
        void onCancel()
      }}
      disabled={busy}
    >
      {cancelLabel}
    </ActionButton>
  )
  const submitButton = (
    <ActionButton
      icon={submitIcon}
      color={submitColor}
      appearance={submitAppearance}
      type="submit"
      form={form}
      disabled={busy}
    >
      {busy ? busyLabel : submitLabel}
    </ActionButton>
  )
  return (
    <>
      {submitFirst ? submitButton : cancelButton}
      {submitFirst ? cancelButton : submitButton}
    </>
  )
}
