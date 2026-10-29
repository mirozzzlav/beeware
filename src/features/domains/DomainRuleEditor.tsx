import { inferAppName, type DomainRule } from './policy'
import TextField from '../../components/TextField'
import Icon from '../../components/Icon'
import ActionButton from '../../components/ActionButton'
import Block from '../../components/Block'
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
    <Block className="domain-row" tone="surface">
      <div className="domain-fields">
        <TextField
          size="normal"
          label={t('domain')}
          value={rule.domain}
          onChange={(event) => onChange('domain', event.target.value)}
          placeholder="facebook.com"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <TextField
          size="normal"
          label={t('appName')}
          value={rule.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder={inferAppName(rule.domain) || t('appName')}
          maxLength={80}
        />
      </div>
      <ActionButton
        size="compact"
        className="remove-domain"
        icon={<Icon name="trash" />}
        aria-label={
          rule.domain
            ? t('removeDomain', { domain: rule.domain })
            : t('removeEmptyDomain')
        }
        onClick={onRemove}
      >
        {t('delete')}
      </ActionButton>
    </Block>
  )
}
