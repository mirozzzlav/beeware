import { useEffect } from 'react'
import { getProtectedSite } from './policy'
import { leaveUntrackedPage } from './visit'
import { useVerification } from './use-verification'
import { useVisitQuestion } from './use-visit-question'
import { isExtension } from './settings-store'
import { useVisit } from './use-visit'
import { useSites } from './use-sites'
import ActionButton from './ActionButton'
import PillIcon from './PillIcon'
import VisitForm from './VisitForm'
import FormActions from './FormActions'
import Panel from './Panel'
import { useLanguage } from './use-language'

const requestedTarget = new URLSearchParams(window.location.search).get(
  'target',
)

export default function App() {
  const { t } = useLanguage()
  const { sites, error: sitesError } = useSites()
  const { mode, error: verificationError } = useVerification()
  const {
    enabled: visitQuestionEnabled,
    question,
    error: visitQuestionError,
  } = useVisitQuestion()
  const loadError = sitesError || verificationError || visitQuestionError
  const target =
    requestedTarget ?? (sites?.[0] ? `https://${sites[0].domain}/` : '')
  const site = sites ? getProtectedSite(target, sites) : undefined
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
  } = useVisit(
    target,
    site,
    !isExtension || requestedTarget === null,
    mode,
    visitQuestionEnabled,
  )
  const showVisitForm =
    !loadError && !!site && !!mode && visitQuestionEnabled !== null && !finished

  useEffect(() => {
    if (sites && !loadError && !site) leaveUntrackedPage(requestedTarget)
  }, [sites, loadError, site])

  if (sites && !loadError && !site) return null

  return (
    <main className="visit-page">
      <Panel
        aria-labelledby="question"
        error={loadError || (showVisitForm ? error : undefined)}
        actions={
          !loadError && site && mode && visitQuestionEnabled !== null ? (
            finished ? (
              <ActionButton icon={<PillIcon color="blue" />} onClick={reset}>
                {t('tryAgain')}
              </ActionButton>
            ) : (
              <FormActions
                form="visit-form"
                submitFirst
                busy={busy}
                onCancel={closeWindow}
                cancelLabel={t('closeWindow')}
                submitLabel={t('continue')}
                busyLabel={t('opening')}
                cancelIcon={<PillIcon color="red" />}
                submitIcon={<PillIcon color="blue" />}
              />
            )
          ) : undefined
        }
      >
        {loadError ? (
          <h1 id="question">{t('loadErrorTitle')}</h1>
        ) : !sites || !mode || visitQuestionEnabled === null ? (
          <h1 id="question">{t('loading')}</h1>
        ) : !site ? null : finished ? (
          <>
            <h1 id="question">
              {t('visitPreview', { site: site.name || site.domain })}
            </h1>
          </>
        ) : (
          <VisitForm
            key={mode}
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
              void continueToSite(event)
            }}
          />
        )}
      </Panel>
    </main>
  )
}
