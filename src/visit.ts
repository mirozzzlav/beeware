import { isExtension, readTotpSecret } from './settings-store.ts'
import { verifyTotp } from './totp.ts'

interface VisitRequest {
  target: string
  reason: string
  code: string
}

interface ApprovalResponse {
  ok?: boolean
  error?: string
}

export function leaveUntrackedPage(target: string | null): void {
  let destination = './settings.html'
  try {
    const url = new URL(target ?? '')
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
      destination = url.href
  } catch {
    // Missing or invalid targets return to settings.
  }
  window.location.replace(destination)
}

export async function approveVisit(
  request: VisitRequest,
  preview: boolean,
): Promise<ApprovalResponse> {
  if (preview) {
    return (await verifyTotp(await readTotpSecret(), request.code))
      ? { ok: true }
      : { ok: false, error: 'invalid-totp' }
  }
  const tab = await browser.tabs.getCurrent()
  return browser.runtime.sendMessage({
    type: 'approve-visit',
    tabId: tab?.id,
    ...request,
  })
}

export async function closeVisitTab(): Promise<void> {
  if (isExtension) {
    const tab = await browser.tabs.getCurrent()
    if (tab?.id === undefined) throw new Error('Missing tab')
    await browser.tabs.remove(tab.id)
  } else {
    window.close()
  }
}
