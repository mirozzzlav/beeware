import { inferAppName, type DomainRule } from './policy'
import TextField from '../../components/TextField'
import Icon from '../../components/Icon'
import { useLanguage } from '../language/use-language'

interface DomainRuleEditorProps {
  rule: DomainRule
  onChange: (field: keyof DomainRule, value: string) => void
  onRemove: () => void
}

export default function DomainRuleEditor({
  rule,
  onChange,
  onRemove,
}: DomainRuleEditorProps) {
  const { t } = useLanguage()
  return (
    <div className="domain-row">
      <div className="domain-fields">
        <TextField
          label={t('domain')}
          value={rule.domain}
          onChange={(event) => onChange('domain', event.target.value)}
          placeholder="facebook.com"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <TextField
          label={t('appName')}
          value={rule.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder={inferAppName(rule.domain) || t('appName')}
          maxLength={80}
        />
      </div>
      <button
        type="button"
        className="secondary remove-domain"
        aria-label={
          rule.domain
            ? t('removeDomain', { domain: rule.domain })
            : t('removeEmptyDomain')
        }
        onClick={onRemove}
      >
        <Icon name="trash" className="settings-trash-icon" />
        <span className="remove-domain-label">{t('delete')}</span>
      </button>
    </div>
  )
}
