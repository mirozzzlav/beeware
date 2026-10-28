# Adding a verification method

Each method owns its configuration validation, input validation, verification and UI. Shared screens, storage and approval handling use the registries and do not branch on method IDs.

1. Create a core module here, following `pin/pin.ts` or `totp/totp-method.ts`. Export a `VerificationMethod` from `types.ts` with a translated option label, a unique error code, an invalid-code message, `normalizeConfig`, `validateInput` and asynchronous `verify`.
2. Register it in `verificationMethods` in `verification.ts`. The mode type and settings options are derived from this registry.
3. Create the input and settings components using the props in `ui.tsx`, then register both in `verificationUI`. TypeScript requires UI for every registered method.
4. Add translation keys to every language in `../language/locales.json` and tests for valid and invalid configuration, input and verification. Run `npm test`, `npm run build`, `npm run lint` and `npm run format:check`.

The input receives `value`, `onChange` and `disabled`. Its value travels through the existing `code` message field; it must be a string. Settings receive the method's `config`, `onChange` and `disabled`. They render inside the shared settings form, so inputs belong to it automatically; do not nest another form.

Configuration is stored under `verification.methods[methodId]`. Switching methods preserves each method's settings. `normalizeConfig(undefined, false)` must return usable draft defaults for a method that has never been configured. Validate required configuration when `active` is true and throw a translated `MessageError` on failure. An optional `legacyConfig` hook can read an older storage format; PIN uses this to migrate the original flat `pin` property.

`validateInput` returns a message key or `null`. `verify` receives the submitted value as `unknown`, the normalized config and an explicit context for dependencies. Validate the submitted type and value here even if the UI already validated them. Background approval and the local preview call the same `verifyCode` dispatcher. The background chooses the method from saved settings, so a message cannot select a different method.

Keep core modules independent of React, the DOM and direct browser API access. UI is registered separately so the background never imports React components. Load UI setup data inside the method's settings component; the shared settings hook does not need method-specific state.

For example, TOTP uses `totp/use-totp-setup.ts` for secret loading and QR generation. It returns loading, error or ready state, ignores work after unmount and preserves the manual key if only QR generation fails. Its settings components only render that state. The visit screen reads the active method together with domains and the question through `../visit/use-visit-settings.ts`.

Initial preferences live in `../settings/initial-settings.ts`: language, active method and initial per-method config. Currently the initial method is PIN with code `1234`. These defaults apply only when no saved preference exists. Adding a method does not require changing initial preferences unless it should become the default.
