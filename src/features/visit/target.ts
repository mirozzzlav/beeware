// DNR substitutions cannot percent-encode a captured URL. Keep it verbatim in
// the fragment so query parameters, plus signs and percent escapes survive.
export function readVisitTarget(pageUrl: string): string | null {
  const url = new URL(pageUrl)
  if (url.hash.startsWith('#target=')) return url.hash.slice('#target='.length)
  // Accept pages opened by earlier extension versions and preview links.
  return url.searchParams.get('target')
}

export function isVisitPage(pageUrl: string, checkPage: string): boolean {
  try {
    const url = new URL(pageUrl)
    url.search = ''
    url.hash = ''
    return url.href === checkPage
  } catch {
    return false
  }
}
