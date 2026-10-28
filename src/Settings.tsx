import { useDomainSettings } from './use-domain-settings'
import DomainRulesFieldset from './DomainRulesFieldset'
import VerificationSettings from './VerificationSettings'
import ErrorMessage from './ErrorMessage'
import Message from './Message'
import Icon from './Icon'
import FormActions from './FormActions'
import LanguageSettings from './LanguageSettings'
import { useLanguage } from './use-language'
import SettingsBlock from './SettingsBlock'
import Tabs from './Tabs'
import Columns, { Column } from './Columns'
import TextField from './TextField'
import Switch from './Switch'

export default function Settings() {
  const { language, t } = useLanguage()
  const {
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
  } = useDomainSettings()

  return (
    <main className="settings-page" aria-labelledby="settings-title">
      <header className="settings-header">
        <h1 id="settings-title">{t('settings')}</h1>
      </header>
      <div className="settings-content">
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
                  <Columns>
                    <Column>
                      <LanguageSettings
                        value={language}
                        disabled={busy}
                        onChange={changeLanguage}
                      />
                      <SettingsBlock
                        title={t('visitQuestionSettings')}
                        description={t('visitQuestionHelp')}
                      >
                        <Switch
                          label={t('visitQuestionToggle')}
                          checked={visitQuestionEnabled}
                          disabled={busy}
                          onChange={changeVisitQuestionEnabled}
                        />
                        <TextField
                          label={t('visitQuestionText')}
                          value={visitQuestionText ?? t('visitQuestion')}
                          placeholder={t('visitQuestion')}
                          disabled={busy || !visitQuestionEnabled}
                          maxLength={500}
                          onChange={(event) =>
                            changeVisitQuestionText(event.target.value)
                          }
                        />
                      </SettingsBlock>
                    </Column>
                  </Columns>
                ),
              },
              {
                id: 'domains',
                label: t('domains'),
                content: (
                  <Columns>
                    <Column>
                      <SettingsBlock
                        title={t('monitoredDomains')}
                        description={t('settingsIntro')}
                      >
                        <form
                          id="settings-form"
                          noValidate
                          onSubmit={(event) => {
                            void save(event)
                          }}
                        >
                          <DomainRulesFieldset
                            rows={rows}
                            disabled={busy}
                            onChange={edit}
                            onAdd={add}
                            onRemove={remove}
                          />
                        </form>
                      </SettingsBlock>
                    </Column>
                  </Columns>
                ),
              },
              {
                id: 'verification',
                label: t('verificationMethod'),
                content: (
                  <Columns>
                    <Column>
                      <VerificationSettings
                        value={verification}
                        onChange={changeVerification}
                        disabled={busy}
                        form="settings-form"
                      />
                    </Column>
                  </Columns>
                ),
              },
            ]}
          />
        ) : null}
      </div>
      <footer className="settings-footer">
        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : saved ? (
          <Message variant="success">{t('settingsSaved')}</Message>
        ) : null}
        {!loadFailed && !loading && (
          <div className="panel-actions">
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
          </div>
        )}
      </footer>
    </main>
  )
}
