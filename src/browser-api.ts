// Keep one API instance for background code and extension pages. In the web
// preview there is no extension API; all consumers use their preview branch.
export let browser = globalThis.browser

const chromeRuntime = (
  globalThis as typeof globalThis & { chrome?: { runtime?: { id?: string } } }
).chrome?.runtime

export const isExtension = Boolean(browser?.runtime?.id || chromeRuntime?.id)

export function setBrowserApi(api: typeof browser): void {
  browser = api
}

export async function initializeBrowserApi(): Promise<void> {
  if (!isExtension || browser?.runtime?.id) return
  const { default: api } = await import('webextension-polyfill')
  setBrowserApi(api)
}
