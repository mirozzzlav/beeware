import type { DomainRule } from './policy.ts'

export function buildRequestRules(
  sites: readonly DomainRule[],
  approvals: Record<string, unknown>,
  checkPage: string,
): browser.declarativeNetRequest.Rule[] {
  return sites.map(({ domain }, index) => {
    const escapedDomain = domain.replace(/\./g, '\\.')
    const excludedTabIds = [-1]
    for (const [key, approvedDomain] of Object.entries(approvals)) {
      if (approvedDomain !== domain || !/^approved-domain:\d+$/.test(key))
        continue
      const tabId = Number(key.slice('approved-domain:'.length))
      if (Number.isSafeInteger(tabId)) excludedTabIds.push(tabId)
    }
    return {
      id: index + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { regexSubstitution: `${checkPage}#target=\\1` },
      },
      condition: {
        regexFilter: `^(https?://([a-z0-9-]+\\.)*${escapedDomain}\\.?(:[0-9]+)?([/?#].*)?)$`,
        isUrlFilterCaseSensitive: false,
        resourceTypes: ['main_frame'],
        excludedTabIds,
        // Match the same most-specific domain as getProtectedSite().
        excludedRequestDomains: sites
          .filter((site) => site.domain.endsWith(`.${domain}`))
          .map((site) => site.domain),
      },
    }
  })
}
