declare module 'webextension-polyfill' {
  // Use the same Firefox WebExtension types for the shared Promise-based API.
  const browser: typeof globalThis.browser
  export default browser
}
