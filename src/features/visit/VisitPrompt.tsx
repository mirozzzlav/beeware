import type { DomainRule } from '../domains/policy'
import type { VerificationMode } from '../verification/verification'
import { useVisit } from './use-visit'
import { useLanguage } from '../language/use-language'
import ActionButton from '../../components/ActionButton'
import PillIcon from '../../components/PillIcon'
import VisitForm from './VisitForm'
import FormActions from '../../components/FormActions'
import Panel from '../../components/Panel'

type VisitPromptProps = {
  target: string
  site: DomainRule
  preview: boolean
  mode: VerificationMode
  visitQuestionEnabled: boolean
  question: string
}

// App keys each prompt by destination and verification method, so a new
// visit cannot reuse a previous code, error or successful preview.
export default function VisitPrompt({
  target,
  site,
  preview,
  mode,
  visitQuestionEnabled,
  question,
}: VisitPromptProps) {
  const { t } = useLanguage()
  const {
    reason,
    code,
    busy,
    error,
    finished,
    changeReason,
    changeCode,
    continueToSite,
    reset,
    closeWindow,
  } = useVisit(target, preview, mode, visitQuestionEnabled)

  return (
    <Panel
      aria-labelledby="question"
      error={finished ? undefined : error}
      actions={
        finished ? (
          <ActionButton icon={<PillIcon color="blue" />} onClick={reset}>
            {t('tryAgain')}
          </ActionButton>
        ) : (
          <FormActions
            form="visit-form"
            busy={busy}
            onCancel={closeWindow}
            cancelLabel={t('closeWindow')}
            submitLabel={t('continue')}
            busyLabel={t('opening')}
            cancelIcon={<PillIcon color="red" />}
            submitIcon={<PillIcon color="blue" />}
          />
        )
      }
    >
      {finished ? (
        <h1 id="question">
          {t('visitPreview', { site: site.name || site.domain })}
        </h1>
      ) : (
        <VisitForm
          mode={mode}
          id="visit-form"
          titleId="question"
          site={site}
          reason={reason}
          visitQuestionEnabled={visitQuestionEnabled}
          question={question}
          code={code}
          busy={busy}
          onReasonChange={changeReason}
          onCodeChange={changeCode}
          onSubmit={(event) => {
            event.preventDefault()
            void continueToSite()
          }}
        />
      )}
    </Panel>
  )
}
