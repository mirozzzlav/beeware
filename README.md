# WakeUp

The project and interface use the name **WakeUp** from the `displayName` field in `package.json`. The full extension name, **Wake Up Neo**, is stored in `longName` and written to the `name` field in the generated `dist/manifest.json`. `src/app-info.ts` exposes these names to the application and build process. The technical package name (`name`) and version are also read from `package.json`.

A Firefox extension built with React and TypeScript that displays a TOTP verification field and asks, “You are about to visit Facebook. What are you going to do there?” before opening a monitored domain. The site name comes from the settings. Continuing requires a valid six-digit code from an external authenticator app and an explanation of at least five words. The other button closes the current tab.

## Build instructions for Mozilla reviewers

Run all commands from the extracted source directory containing `package.json` and `package-lock.json`.

### Environment and prerequisites

- Build environment: Devuan GNU/Linux 6 (excalibur), x86_64.
- Node.js **24.19.0** with npm **11.17.0**. Download the matching Node.js distribution from [the official release directory](https://nodejs.org/dist/v24.19.0/) and follow [the installation instructions](https://nodejs.org/en/download). Ensure its `bin` directory is on `PATH`.
- Internet access to the npm registry is required to install dependencies. No API keys, accounts, environment variables or external services are required for the build.
- The optional packaging command below requires the `zip` command.

### Install and build

```sh
node --version
npm --version
npm ci --include=dev
npm run build
```

The first two commands should print `v24.19.0` and `11.17.0`. `npm ci` installs the exact dependency versions recorded in `package-lock.json`; keep the lockfile unchanged. Build tools are installed locally by npm; no global Vite or TypeScript installation is needed.

`npm run build` runs TypeScript checking followed by a production Vite build. Vite clears the output directory, bundles the React application and background script, generates `manifest.json` from `manifest.template.json` and the metadata in `package.json`, copies the standalone extension icon from `public/icon.svg`, and generates CSS variables through `design-tokens.plugin.ts` using `src/tokens.json`.

The complete installable extension is in `dist/`, with `manifest.json` directly inside it. Compare the contents of this directory with the submitted extension package. Do not edit generated files manually or use the development server to produce the submission.

### Optional checks and packaging

```sh
npm run lint
npm run format:check
npm test
npm run package
```

`npm run package` runs a fresh production build and creates two archives in `releases/`, named using `name` and `version` from `package.json`:

- `wakeup-0.1.0.zip`: the contents of `dist/`, with `manifest.json` at the archive root. Upload this as the extension package.
- `wakeup-0.1.0-source.zip`: the matching source code, this README, lockfile, tests, scripts and build configuration. Attach this as the source code package for Mozilla reviewers.

The command requires Node.js 24, installed npm dependencies (`npm ci --include=dev`) and the `zip` command. It replaces older ZIP files beginning with the current package name followed by `-` in `releases/` only after both new archives have been created successfully. ZIP files elsewhere are left untouched. The source archive excludes dependencies, build output, release archives, Git and IDE metadata, environment files and logs. The `releases/` directory is ignored by Git.

For functional testing, follow the Firefox testing instructions below; the extension does not require an online account. TOTP setup requires an authenticator app.

### Source archive for AMO

Submit a separate ZIP of the matching source tree, including this README, `package.json`, `package-lock.json`, `src/`, `public/`, `manifest.template.json`, `scripts/`, `tests/`, HTML entry files, and all build, TypeScript, ESLint and formatting configuration files. Exclude `node_modules/`, `dist/`, `.git/`, IDE settings and generated release archives. Attach the matching source archive to each submitted version.

Mozilla's [source code submission requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/) explicitly recommend including build instructions in a README shipped with the sources.

## Local preview

The project uses Node.js 24. Tests import TypeScript files directly and do not run on Node.js 20. The development version is recorded in `.nvmrc`. If you use [nvm](https://github.com/nvm-sh/nvm), run the following commands from the project root:

```sh
nvm install
nvm use
```

In PyCharm, select the same Node.js 24 interpreter for npm configurations. Verify it with `node --version` in the terminal where you run commands.

```sh
npm install
npm run dev
```

- Visit prompt: http://localhost:5173/
- Settings: http://localhost:5173/settings.html

The preview saves its settings in `localStorage`. The extension keeps separate settings in `browser.storage.local`.

Use the preview to try the form, TOTP verification and five-word validation. First, scan the QR code on the preview settings page with your authenticator app; the preview uses its own key, separate from the extension. Successful confirmation displays a success message without opening the destination page. Browsers generally prevent web applications from closing tabs opened manually; in that case, the preview asks you to close the tab yourself. Navigation interception and tab closing work in the extension.

## Settings

Click the WakeUp icon in Firefox or open the extension's preferences in `about:addons`.

On first use, the extension automatically generates and saves one shared TOTP key for all monitored domains. The settings page continues to display it as a QR code and a text key for manual setup in an external authenticator app. It uses SHA-1, six digits and a 30-second interval according to [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238). Verification accepts one adjacent interval in either direction to allow for clock differences. Domain changes and restarts do not change the key. QR code generation and verification happen locally without an external service. This is a tool for taking a mindful pause, not a security mechanism.

The site name is derived automatically from its domain, for example facebook.com → Facebook. You can edit it manually; a custom name is preserved when the domain changes. Add or remove entries as needed. Saving an empty list disables navigation interception.

Confirm changes with **Save settings**. Firefox requests access when you add a new domain. Changes are not saved without permission. A domain rule also covers its subdomains; if a subdomain has its own entry, that entry's site name is used.

## Testing in Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `dist/manifest.json`.
4. Click the extension icon, scan the QR code with an external authenticator app and configure the domains. The default list includes Facebook.
5. Open a monitored domain in a new tab. The WakeUp prompt appears instead of the destination page.
6. **Continue** requires six digits and at least five words. An incorrect or expired code displays an error. A valid code and explanation allow navigation to the original URL.
7. Navigate to another domain and return: the prompt appears again. A new tab also requires its own confirmation.
8. **Close window** closes the current tab containing the prompt.

Confirmation remains valid while visiting the domain in that tab. It is stored only in browser memory. Changing the settings clears existing confirmations. The explanation text is neither saved nor sent to a server.

After changing the code, run `npm run build` and click **Reload** for the extension in `about:debugging`. Firefox removes the temporary extension when it restarts.

## Checks and formatting

Use Node.js 24, as specified in `.nvmrc`, to run the TypeScript tests directly.

- `npm run lint` — ESLint checks for React and TypeScript.
- `npm run lint:fix` — automatic lint fixes.
- `npm run format` — formatting with Prettier.
- `npm run format:check` — formatting checks.
- `npm test` — domains, word counting, settings and automatic names, RFC 6238 TOTP test vectors, visit approval and background script behavior using simulated Firefox APIs.
- `npm run build` — type checking and production build.

## Project structure

- `src/App.tsx` — visit prompt screen; `use-visit.ts` handles form state and submission.
- `src/VisitForm.tsx`, `src/TotpField.tsx` — controlled visit form and reusable TOTP field with a label and unique IDs.
- `src/visit.ts` — visit approval and tab closing in the extension and preview.
- `src/Settings.tsx` — settings screen; `use-domain-settings.ts` handles loading, editing and saving.
- `src/DomainRuleEditor.tsx` — standalone controlled editor for one domain and its site name.
- `src/DomainRulesFieldset.tsx` — controlled list of domain editors with add, remove and shared `disabled` state; independent of persistence and the settings page.
- `src/LanguageSettings.tsx` — language selection using the shared `SelectField`.
- `src/domain-draft.ts` — draft settings rows, automatic names and conversion to saved rules.
- `src/TextField.tsx`, `src/Icon.tsx`, `src/ErrorMessage.tsx` — shared UI elements; fields automatically associate labels with unique input IDs.
- `src/FormField.tsx`, `src/SelectField.tsx` — shared wrapper for labeled fields and a select field supporting native HTML attributes.
- `src/FormActions.tsx` — cancel and submit buttons shared by both forms; accepts labels, icons, processing state and a form ID.
- `src/MatrixBackground.tsx`, `src/matrix-animation.ts` — React wrapper and standalone canvas renderer with a cleanup function that stops animation and removes event listeners.
- `src/settings-store.ts` — settings persistence.
- `src/totp.ts` — key generation, provisioning URI and TOTP verification.
- `src/TotpSetup.tsx` — QR code and text key in the settings.
- `src/policy.ts` — domain validation, monitored domain selection and word counting.
- `src/background.ts` — navigation interception and temporary approvals.
- `manifest.template.json` — Firefox permissions and extension settings template; the build adds the name, version and identifier from `package.json`.
- `public/icon.svg` — standalone red-and-blue capsule icon, copied unchanged into the extension during builds.

The extension identifier is generated as `@${name}.wondercules` from the `name` field in `package.json` and written to `browser_specific_settings.gecko.id`. Changing the technical package name changes the extension's identity in Firefox. Keep it unchanged after publication, including in subsequent versions.

## Languages and translations

Text for the main application and settings, including validation messages, is stored in `src/locales.json`. Each language has a code, a display name (`name`) and a `messages` dictionary. The language list in settings is generated automatically from this file. To add a language, copy an existing entry under a new code and translate its values. Preserve the same keys and placeholders, such as `{count}`, `{site}` and `{domain}`. Tests check dictionary completeness and placeholders.

In components, use `const { t } = useLanguage()` and calls such as `t('saveSettings')` or `t('reasonTooShort', { count: 5 })`. Selecting a language immediately previews it in settings. Saving writes it to `browser.storage.local` in the extension or `localStorage` in the preview and updates other open application pages. English is the default language and is also used when the saved language is unknown or has been removed.

The default language is configured only through `defaultLanguage` in `src/i18n.ts`. Vite uses it to populate the `lang` attribute and translated title in both `index.html` and `settings.html` during development and production builds. Once the application loads, `LanguageProvider` uses a single `language` value: the user's saved supported language or the default. This value controls interface text, the document language and the page title.

Settings groups use `SettingsBlock` for a shared gray background, heading and explanatory text.

## Design tokens

All colors, font sizes and weights, font families, line heights, border and icon stroke widths, corner radii, spacing and shadows are defined in `src/tokens.json`. Add new visual values to this file instead of hardcoding them in components or styles.

Base tokens (`palette-*`, `font-*`, `space-*` and `radius-*`) define the palette and scales. Semantic `color-*` tokens reference them by purpose, for example `color-text`, `color-surface`, `color-border-control` and `color-error-text`. Shared borders and focus styles use `border-control`, `border-button`, `border-divider` and `outline-focus`. Changing one definition updates all components that use it.

In CSS, use declarations such as `color: var(--color-text)` and `font-size: var(--font-size-small)`. For React styles, use the type-checked `tokenVar('color-action-success')` helper from `src/design-tokens.ts`; CSS variables also support theme overrides. For canvas, QR codes and other APIs that require concrete values, import base tokens from `tokens.json`, for example `tokens['palette-green-400']`. Semantic tokens contain CSS references, so do not pass them directly to these APIs.

The Vite plugin in `design-tokens.plugin.ts` generates CSS variables from the tokens. The responsive `@media (--compact)` query uses the `breakpoint-compact` token. The standalone icon in `public/icon.svg` embeds its own colors and stroke widths so it can be opened or edited independently. Do not edit generated values in `dist` manually.

`npm run lint` checks for hardcoded design values in React and TypeScript and verifies token usage in CSS. Run `npm run check:tokens` for the standalone CSS check; it also detects missing and circular token references. Structural values such as `0`, `100%`, SVG coordinates and inherited styles remain allowed.
