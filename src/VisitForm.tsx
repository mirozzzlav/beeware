import type { FormEventHandler } from 'react'
import { minimumWords, type DomainRule } from './policy'
import { verificationUI } from './verification/ui'
import type { VerificationMode } from './verification'
import { useLanguage } from './use-language'

type VisitFormProps = {
  id: string
  mode: VerificationMode
  titleId: string
  site: DomainRule
  reason: string
  visitQuestionEnabled: boolean
  question: string
  code: string
  busy: boolean
  onReasonChange: (value: string) => void
  onCodeChange: (value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export default function VisitForm({
  id,
  mode,
  titleId,
  site,
  reason,
  visitQuestionEnabled,
  question,
  code,
  busy,
  onReasonChange,
  onCodeChange,
  onSubmit,
}: VisitFormProps) {
  const { t } = useLanguage()
  const VerificationInput = verificationUI[mode].Input
  return (
    <form id={id} noValidate onSubmit={onSubmit}>
      <h1 id={titleId} className="visit-question">
        {t('visiting')} <strong>{site.name || site.domain}</strong>.
        {visitQuestionEnabled && (
          <>
            <br />
            {question}
          </>
        )}
      </h1>
      {visitQuestionEnabled && (
        <textarea
          aria-label={question}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder={t('reasonPlaceholder', { count: minimumWords })}
          rows={3}
          maxLength={3000}
          disabled={busy}
          required
        />
      )}
      <VerificationInput value={code} onChange={onCodeChange} disabled={busy} />
    </form>
  )
}
