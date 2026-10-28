import { MessageError } from '../language/i18n.ts'

export const minimumWords = 5
export interface DomainRule {
  domain: string
  name: string
}
export const protectedSites: DomainRule[] = [
  { domain: 'facebook.com', name: 'Facebook' },
]

export function countWords(text: string): number {
  return (
    text.match(/\p{L}[\p{L}\p{M}\p{N}]*(?:['’-][\p{L}\p{M}\p{N}]+)*/gu) ?? []
  ).length
}

export function normalizeDomain(value: string): string {
  const input = value.trim()
  if (!input || /\s/.test(input)) throw new MessageError('invalidDomain')
  let url: URL
  try {
    url = new URL(input.includes('://') ? input : `https://${input}`)
  } catch {
    throw new MessageError('invalidDomain')
  }
  const domain = url.hostname
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^www\./, '')
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    domain.length > 253 ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      domain,
    )
  )
    throw new MessageError('invalidDomainDetails')
  return domain
}

export function inferAppName(value: string): string {
  try {
    const label = normalizeDomain(value).split('.')[0]
    return label
      .split(/[-_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch {
    return ''
  }
}

export function normalizeRules(value: unknown): DomainRule[] {
  if (!Array.isArray(value)) throw new MessageError('invalidRules')
  const domains = new Set<string>()
  return value.map((rule: unknown) => {
    if (
      !rule ||
      typeof rule !== 'object' ||
      !('domain' in rule) ||
      typeof rule.domain !== 'string' ||
      !('name' in rule) ||
      typeof rule.name !== 'string'
    ) {
      throw new MessageError('invalidRule')
    }
    const domain = normalizeDomain(rule.domain)
    if (domains.has(domain))
      throw new MessageError('duplicateDomain', { domain })
    domains.add(domain)
    const name = rule.name.trim()
    if (name.length > 80) throw new MessageError('appNameTooLong')
    return { domain, name }
  })
}

export function getProtectedSite(
  value: string,
  rules: readonly DomainRule[] = protectedSites,
) {
  try {
    const url = new URL(value)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return undefined
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
    // The most specific rule wins when a subdomain has its own application name.
    return [...rules]
      .sort((a, b) => b.domain.length - a.domain.length)
      .find(
        ({ domain }) => hostname === domain || hostname.endsWith(`.${domain}`),
      )
  } catch {
    return undefined
  }
}
