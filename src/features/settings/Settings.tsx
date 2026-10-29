import { useSettings } from './use-settings'
import DomainRulesFieldset from '../domains/DomainRulesFieldset'
import VerificationSettings from '../verification/VerificationSettings'
import FormFooter from '../../components/FormFooter'
import Icon from '../../components/Icon'
import FormActions from '../../components/FormActions'
import LanguageSettings from './LanguageSettings'
import VisitQuestionSettings from './VisitQuestionSettings'
import { useLanguage } from '../language/use-language'
import SettingsBlock from './SettingsBlock'
import SettingsSection from './SettingsSection'
import Tabs from '../../components/Tabs'

export default function Settings() {
  const { t } = useLanguage()
  const {
    language,
    rows,
    loading,
    loadFailed,
    busy,
    error,
    saved,
    verification,
    visitQuestionEnabled,
    visitQuestionText,
    changeVisitQuestionText,
    changeVisitQuestionEnabled,
    changeVerification,
    edit,
    add,
    remove,
    closeWindow,
    changeLanguage,
    save,
  } = useSettings()

  return (
    <main className="settings-page" aria-labelledby="settings-title">
      <header className="settings-header">
        <h1 id="settings-title">{t('settings')}</h1>
      </header>
      <form
        id="settings-form"
        className="settings-content"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        {loading ? (
          <p role="status">{t('loading')}</p>
        ) : !loadFailed ? (
          <Tabs
            label={t('settings')}
            disabled={busy}
            items={[
              {
                id: 'general',
                label: t('general'),
                content: (
                  <SettingsSection>
                    <LanguageSettings
                      value={language}
                      disabled={busy}
                      onChange={changeLanguage}
                    />
                    <VisitQuestionSettings
                      enabled={visitQuestionEnabled}
                      text={visitQuestionText}
                      disabled={busy}
                      onEnabledChange={changeVisitQuestionEnabled}
                      onTextChange={changeVisitQuestionText}
                    />
                  </SettingsSection>
                ),
              },
              {
                id: 'domains',
                label: t('domains'),
                content: (
                  <SettingsSection>
                    <SettingsBlock
                      title={t('monitoredDomains')}
                      description={t('settingsIntro')}
                    >
                      <DomainRulesFieldset
                        rows={rows}
                        disabled={busy}
                        onChange={edit}
                        onAdd={add}
                        onRemove={remove}
                      />
                    </SettingsBlock>
                  </SettingsSection>
                ),
              },
              {
                id: 'verification',
                label: t('verificationMethod'),
                content: (
                  <SettingsSection>
                    <VerificationSettings
                      value={verification}
                      onChange={changeVerification}
                      disabled={busy}
                    />
                  </SettingsSection>
                ),
              },
            ]}
          />
        ) : null}
      </form>
      <FormFooter
        className="settings-footer"
        error={error}
        status={saved ? t('settingsSaved') : null}
        actions={
          !loadFailed &&
          !loading && (
            <FormActions
              form="settings-form"
              submitFirst
              busy={busy}
              onCancel={closeWindow}
              cancelLabel={t('cancel')}
              submitLabel={t('saveSettings')}
              busyLabel={t('saving')}
              cancelIcon={<Icon name="close" />}
              submitIcon={<Icon name="submit" />}
              submitColor="color-action-success"
              submitAppearance="filled"
            />
          )
        }
      />
    </main>
  )
}
