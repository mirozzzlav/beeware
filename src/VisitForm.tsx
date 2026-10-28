import type { FormEventHandler } from 'react'
import { minimumWords, type DomainRule } from './policy'
import TotpField from './TotpField'
import { useLanguage } from './use-language'

type VisitFormProps = {
  id: string
  titleId: string
  site: DomainRule
  reason: string
  code: string
  busy: boolean
  onReasonChange: (value: string) => void
  onCodeChange: (value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export default function VisitForm({
  id,
  titleId,
  site,
  reason,
  code,
  busy,
  onReasonChange,
  onCodeChange,
  onSubmit,
}: VisitFormProps) {
  const { t } = useLanguage()
  return (
    <form id={id} noValidate onSubmit={onSubmit}>
      <h1 id={titleId} className="visit-question">
        {t('visiting')} <strong>{site.name || site.domain}</strong>.
        <br />
        {t('visitQuestion')}
      </h1>
      <textarea
        aria-label={t('visitQuestion')}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        placeholder={t('reasonPlaceholder', { count: minimumWords })}
        rows={4}
        maxLength={3000}
        disabled={busy}
        required
      />
      <TotpField
        value={code}
        onChange={onCodeChange}
        disabled={busy}
        required
      />
    </form>
  )
}
