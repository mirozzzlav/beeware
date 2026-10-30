# WakeUp

The project and interface use the name **WakeUp** from the `displayName` field in `package.json`. The full extension name, **Wake Up Neo**, is stored in `longName` and written to the `name` field in the generated `dist/manifest.json`. `src/app-info.ts` exposes these names to the application and build process. The technical package name (`name`) and version are also read from `package.json`.

A Firefox extension built with React and TypeScript that asks, “You are about to visit Facebook. What are you going to do there?” before opening a monitored domain. The site name comes from the settings. By default, continuing requires an explanation of at least five words and the selected verification method: a six-digit code from an external authenticator app or a saved PIN entered on a shuffled keypad. You can customize or disable the question in settings. The other button closes the current tab.

## Author and support

Author: **Miro Furinda**. For support and bug reports, contact [info@mirofurinda.com](mailto:info@mirofurinda.com).

When publishing on AMO, use **Miro Furinda** as the public author name and **info@mirofurinda.com** as the support email.

## License

WakeUp's original code is licensed under the [MIT License](LICENSE). Select MIT when publishing the extension on AMO. The build includes this license in the extension package, and the source archive includes it as well.

Third-party dependencies retain their own licenses. The bundled DSEG font is licensed under SIL Open Font License 1.1; its notice is included in `public/licenses/DSEG-LICENSE.txt` and copied into the extension package.

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

The preview saves its settings as one JSON snapshot in `localStorage`, reading older separate keys until the first save. The extension keeps separate settings in `browser.storage.local` and saves all preferences in one storage operation.

Use the preview to try both verification methods and five-word validation. Select PIN in settings and save a PIN, or scan the QR code with your authenticator app for TOTP; the preview uses its own settings and key, separate from the extension. Successful confirmation displays a success message without opening the destination page. Browsers generally prevent web applications from closing tabs opened manually; in that case, the preview asks you to close the tab yourself. Navigation interception and tab closing work in the extension.

## Settings

Click the WakeUp icon in Firefox or open the extension's preferences in `about:addons`.

Settings use a full-width page with three tabs: General (language and visit question), Domains and Verification method. Draft values are preserved when switching tabs, and Save settings saves all three tabs together. Tabs support arrow keys, Home and End; on narrow screens the tab bar scrolls horizontally. The header and footer stay visible while scrolling. Save comes before Cancel in the left-aligned footer, with success and error messages directly above the buttons.

Under **General**, use the question switch to require or skip the written explanation, and edit the question text. The original question is the default in the selected language. An enabled question cannot be saved with empty or whitespace-only text. Disabling the question preserves its custom text and leaves PIN/TOTP verification active. English is the default language and appears first in the language dropdown.

Choose **Authenticator app code** or **PIN on a shuffled keypad** under **Verification method**. New installations default to PIN with the initial code `1234`; change it in settings as desired. Existing saved method selections and PINs are preserved. PIN mode accepts 4 to 12 digits, including leading zeroes. The visit screen shows each digit from 0 to 9 once in a freshly shuffled layout for each visit. The layout stays fixed while entering the PIN; the backspace icon removes the last digit and the trash icon clears the entry. Their tooltips and accessible labels describe each action. PIN digits are visible while entering them and in settings. The PIN and selected mode are saved locally; the background script checks the saved mode and code before approving navigation. Switching back to TOTP preserves its key, and switching to PIN again preserves the saved PIN.

On first use, the extension automatically generates and saves one shared TOTP key for all monitored domains. Selecting TOTP in settings displays it as a QR code and a text key for manual setup in an external authenticator app. It uses SHA-1, six digits and a 30-second interval according to [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238). Verification accepts one adjacent interval in either direction to allow for clock differences. Domain changes and restarts do not change the key. QR code generation and verification happen locally without an external service. This is a tool for taking a mindful pause, not a security mechanism.

The site name is derived automatically from its domain, for example facebook.com → Facebook. You can edit it manually; a custom name is preserved when the domain changes. Add or remove entries as needed. Saving an empty list disables navigation interception.

Confirm changes with **Save settings**. Firefox requests access when you add a new domain. Changes are not saved without permission. A domain rule also covers its subdomains; if a subdomain has its own entry, that entry's site name is used.

## Testing in Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `dist/manifest.json`.
4. Click the extension icon, choose a verification method and configure the domains. For TOTP, scan the QR code with an external authenticator app; for PIN, enter a PIN of 4 to 12 digits. Save the settings. The default list includes Facebook.
5. Open a monitored domain in a new tab. The WakeUp prompt appears instead of the destination page.
6. **Continue** requires at least five words when the question is enabled, and either a valid TOTP code or the correct PIN entered on the shuffled keypad. An incorrect code displays an error; expired TOTP codes also fail. A valid code and explanation allow navigation to the original URL. Repeat with the other verification method, checking leading zeroes, deletion and clearing in PIN mode. Customize the question, then disable it and confirm that verification still works without an explanation. An enabled question with empty text must display a validation error when saving settings.
7. Navigate to another domain and return: the prompt appears again. A new tab also requires its own confirmation.
8. **Close window** closes the current tab containing the prompt.

Confirmation remains valid while visiting the same configured domain in that tab, including its subdomains unless they have their own configured rule. Leaving for another domain (including another protected domain), closing the tab, restarting the browser or updating the extension clears the relevant confirmation. Restarting only the background context within the same browser session preserves confirmations. Changing the settings clears existing confirmations without deleting unrelated session data. The explanation text is neither saved nor sent to a server.

Approval, rule updates and cleanup run in order. The background verifies that the tab is still on the original prompt after installing the temporary exception and before opening the destination. A settings change during verification cancels the pending approval. Concurrent submissions cannot navigate the same prompt twice. Browser API failures return a failed approval; failed rule installation or navigation rolls back the saved confirmation and restores the redirect rule.

Navigation interception uses `declarativeNetRequest` session rules with the `declarativeNetRequestWithHostAccess` permission. Each monitored domain redirects top-level HTTP(S) requests to WakeUp; existing approvals exclude only the approved tab from that domain's rule. More specific configured subdomains have independent rules. Rules are replaced when settings or approvals change and recreated on browser startup. The original request URL is passed verbatim in the prompt's `#target=` fragment to preserve query parameters and percent escapes; older `?target=` links are still accepted.

After changing the code, run `npm run build` and click **Reload** for the extension in `about:debugging`. Firefox removes the temporary extension when it restarts.

## Checks and formatting

Use Node.js 24, as specified in `.nvmrc`, to run the TypeScript tests directly.

- `npm run lint` — ESLint checks for React and TypeScript.
- `npm run lint:fix` — automatic lint fixes.
- `npm run format` — formatting with Prettier.
- `npm run format:check` — formatting checks.
- `npm test` — domains, word counting, settings drafts and automatic names, combined visit settings reads, storage subscriptions (including concurrent reads and cleanup), RFC 6238 TOTP test vectors, visit approval and background script behavior using simulated Firefox APIs.
- `npm run build` — type checking and production build.

## Project structure

Shared UI lives in `src/components/`. Components with their own styles or assets, such as `MatrixBackground`, keep those files together in a dedicated folder. Application code is grouped in `src/features/` by domains, language, settings, verification and visits. Each feature keeps its UI, hooks and logic together. Entry points and shared design tokens remain at the `src/` root.

- `src/features/visit/App.tsx` — loads the visit settings and handles redirects; `VisitPrompt.tsx` owns the ready prompt and uses `use-visit.ts` for form state and submission. Changing the destination or verification method resets the prompt, including its code, explanation, errors and preview result.
- `src/features/visit/VisitForm.tsx`, `src/features/verification/totp/TotpField.tsx` — controlled visit form and reusable TOTP field with a label and unique IDs.
- `src/features/visit/visit.ts` — visit approval and tab closing in the extension and preview.
- `src/features/settings/Settings.tsx` — settings screen with one form around all tabs; `use-settings.ts` handles loading, permissions, persistence and feedback. Hidden tabs stay mounted to preserve drafts.
- `src/features/settings/use-settings-draft.ts`, `src/features/settings/settings-draft.ts` — local draft values and a pure reducer for domains, language, verification and the question. Revisions invalidate old feedback and prevent pending saves from overwriting newer edits. Language changes still preview immediately through the language provider; the form's selected language remains part of its local draft.
- `src/features/settings/SettingsSection.tsx`, `src/features/settings/VisitQuestionSettings.tsx` — shared settings tab layout and controlled question settings.
- `src/features/settings/observe-settings.ts`, `src/features/settings/use-stored-settings.ts` — shared storage subscriptions for the extension and preview. Only the latest read can publish a value or error, and cleanup ignores pending reads. Hook sources are declared at module scope so renders do not restart subscriptions. The language provider uses the observer directly to retain its editable language preview.
- `src/features/visit/use-close-tab.ts` — shared tab closing and preview feedback with timer cleanup on unmount.
- `src/features/domains/DomainRuleEditor.tsx` — standalone controlled editor for one domain and its site name.
- `src/features/domains/DomainRulesFieldset.tsx` — controlled list of domain editors with add, remove and shared `disabled` state; independent of persistence and the settings page.
- `src/features/settings/LanguageSettings.tsx` — language selection using the shared `SelectField`.
- `src/features/domains/domain-draft.ts` — draft settings rows, automatic names and conversion to saved rules.
- `src/components/TextField.tsx`, `src/components/Icon.tsx`, `src/components/ErrorMessage.tsx` — shared UI elements; fields automatically associate labels with unique input IDs.
- `src/components/FormField.tsx`, `src/components/SelectField.tsx` — shared wrapper for labeled fields and a select field supporting native HTML attributes.
- `src/components/FormActions.tsx` — cancel and submit buttons shared by both forms; accepts labels, icons, processing state and a form ID.
- `src/components/FormFeedback.tsx` — shared error/success feedback with error priority and preserved alert/status roles.
- `src/components/MatrixBackground/MatrixBackground.tsx`, `src/components/MatrixBackground/MatrixBackground.css`, `src/components/MatrixBackground/matrix-renderer.ts` — reusable responsive binary background, its styles and standalone canvas renderer; follows its container size and cleans up animation, resize observation and event listeners.
- `src/features/settings/settings-store.ts` — settings persistence.
- `src/features/verification/totp/totp.ts` — key generation, provisioning URI and TOTP verification.
- `src/features/verification/totp/use-totp-setup.ts` — loads the shared secret and generates its QR code with cleanup on unmount. A QR failure preserves the manual key; a secret-loading failure prevents setup. `TotpSettings.tsx` and `TotpSetup.tsx` render the resulting loading, error and ready states.
- `src/features/verification/pin/PinKeypad.tsx`, `src/features/verification/VerificationSettings.tsx` — shuffled PIN keypad and method selection.
- `src/features/verification/verification.ts`, `src/features/verification/` — core registry and individual verification modules; see [the extension guide](src/features/verification/README.md).
- `src/features/settings/initial-settings.ts` — initial language, verification method and per-method configuration.
- `src/features/visit/use-visit-settings.ts` — one subscription for domains, verification and the visit question, with shared loading and error states. `readVisitSettings` reads these preferences together in one extension storage call, or synchronously from preview storage, before publishing the configuration. Default question text follows the current language without reloading storage.
- `src/components/Pill.tsx` — shared visual foundation for action buttons and status messages.
- `src/features/domains/policy.ts` — domain validation, monitored domain selection and word counting.
- `src/background.ts` — navigation interception and temporary approvals.
- `manifest.template.json` — Firefox permissions and extension settings template; the build adds the name, version and identifier from `package.json`.
- `public/icon.svg` — standalone red-and-blue capsule icon, copied unchanged into the extension during builds.

The extension identifier is generated as `@${name}.wondercules` from the `name` field in `package.json` and written to `browser_specific_settings.gecko.id`. Changing the technical package name changes the extension's identity in Firefox. Keep it unchanged after publication, including in subsequent versions.

## Reusing the responsive background

Place `MatrixBackground` inside a parent with the `matrix-container` class. The parent determines its dimensions through its content or your own layout styles; the background fills that area behind the content and does not intercept clicks. It also inherits the parent's rounded corners.

```tsx
import MatrixBackground from './components/MatrixBackground/MatrixBackground'

;<section className="matrix-container">
  <MatrixBackground />
  <MyComponent />
</section>
```

The component imports its own CSS and uses the project's design tokens and bundled font. Below `md` (768px), it is hidden and skips canvas rendering and font loading. Between `md` and `lg` (1024px), it draws static zeros and ones. From `lg` upward, it runs the falling-digit animation at up to 30 frames per second, pausing when the document is hidden. Reduced-motion preferences keep the desktop background static. Media query listeners switch modes when the viewport or motion preference changes, cleaning up the previous renderer. `ResizeObserver` keeps the canvas in sync when the container changes size. Each instance has its own layout. The visit page places it directly inside `#root`, which already provides positioning and an isolated stacking context.

## Languages and translations

Text for the main application and settings, including validation messages, is stored in `src/features/language/locales.json`. Each language has a code, a display name (`name`) and a `messages` dictionary. The language list in settings is generated automatically from this file. To add a language, copy an existing entry under a new code and translate its values. Preserve the same keys and placeholders, such as `{count}`, `{site}` and `{domain}`. Tests check dictionary completeness and placeholders.

In components, use `const { t } = useLanguage()` and calls such as `t('saveSettings')` or `t('reasonTooShort', { count: 5 })`. Selecting a language immediately previews it in settings. Saving writes it to `browser.storage.local` in the extension or `localStorage` in the preview and updates other open application pages. English is the default language and is also used when the saved language is unknown or has been removed.

Initial preferences are configured in `src/features/settings/initial-settings.ts`: language, verification method (PIN) and per-method configuration (initial PIN `1234`). Saved user preferences take precedence. `defaultLanguage` in `src/features/language/i18n.ts` reads that shared initial language. Vite uses it to populate the `lang` attribute and translated title in both `index.html` and `settings.html` during development and production builds. Once the application loads, `LanguageProvider` uses a single `language` value: the user's saved supported language or the default. This value controls interface text, the document language and the page title.

`Block` is the shared visual container used by settings and the main screen's PIN keypad and TOTP field. It provides a border, rounded corners, `tone="subtle"` (gray, default) or `tone="surface"` (white), and `padding="sm" | "md" | "lg"` (16, 20 or 24 px; default 24). Both `title` and `description` are optional; the block renders only the provided text and automatically connects it to accessibility labels. With neither provided it renders only the content. It also accepts normal div attributes, except the native tooltip `title`, which is used for the visible heading. Settings groups use `SettingsBlock`, a thin wrapper that delegates heading, description and styling to `Block`. The QR setup uses the surface tone; the PIN keypad uses small padding.

`Pill` provides the rounded shape, padding, shadow and icon placement for `ActionButton`. `Message` renders error and success feedback as plain text with an icon and the appropriate `alert` or `status` role. It has no pill wrapper, background or border. Footer feedback and TOTP errors use this same component. `FormFooter` provides the shared gray footer, feedback and action layout for the main application and settings.

Settings use a single column inside a left-aligned wrapper with a maximum width of 768px (`size-settings-content`). The header title and footer actions align with the content through the same `settings-container` class. Blocks fill the available width, with language and question settings stacked vertically in General. Horizontal padding is 36px, reduced to 16px below `sm`.

## Design tokens

All colors, font sizes and weights, font families, line heights, border and icon stroke widths, corner radii, spacing and shadows are defined in `src/tokens.json`. Add new visual values to this file instead of hardcoding them in components or styles.

Base tokens (`palette-*`, `font-*`, `space-*` and `radius-*`) define the palette and scales. Semantic `color-*` tokens reference them by purpose, for example `color-text`, `color-surface`, `color-border-control` and `color-error-text`. Shared borders and focus styles use `border-control`, `border-button`, `border-divider` and `outline-focus`. Changing one definition updates all components that use it.

In CSS, use declarations such as `color: var(--color-text)` and `font-size: var(--font-size-small)`. For React styles, use the type-checked `tokenVar('color-action-success')` helper from `src/design-tokens.ts`; CSS variables also support theme overrides. For canvas, QR codes and other APIs that require concrete values, import base tokens from `tokens.json`, for example `tokens['palette-green-400']`. Semantic tokens contain CSS references, so do not pass them directly to these APIs.

The Vite plugin in `design-tokens.plugin.ts` generates CSS variables from the tokens and expands named media queries. Breakpoints follow [Tailwind CSS defaults](https://tailwindcss.com/docs/responsive-design):

| Name  | Minimum width | Equivalent at the default browser font size |
| ----- | ------------- | ------------------------------------------- |
| `sm`  | `40rem`       | 640px                                       |
| `md`  | `48rem`       | 768px                                       |
| `lg`  | `64rem`       | 1024px                                      |
| `xl`  | `80rem`       | 1280px                                      |
| `2xl` | `96rem`       | 1536px                                      |

Use `@media (--md)` for widths at or above `md`, and `@media (--max-md)` for widths strictly below `md`. All five breakpoints support both forms, without gaps or overlapping boundaries. Values live in the `breakpoint-*` tokens; Tailwind is not a dependency.

The visit page uses a card on mobile, tablet and desktop. Below `md`, the card sits at the top with 24px of vertical page padding and 8px of horizontal padding, and stays horizontally centered. From `md` upward, it is centered vertically as well. Compact spacing and stacked domain rows apply below `sm`. The remaining breakpoints are available for future layout changes.

The standalone icon in `public/icon.svg` embeds its own colors and stroke widths so it can be opened or edited independently. Do not edit generated values in `dist` manually.

`npm run lint` checks for hardcoded design values in React and TypeScript and verifies token usage in CSS. Run `npm run check:tokens` for the standalone CSS check; it also detects missing and circular token references. Structural values such as `0`, `100%`, SVG coordinates and inherited styles remain allowed.
