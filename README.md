# WakeUp

Projekt a rozhranie používajú názov **WakeUp** z poľa `displayName` v `package.json`. Dlhý názov pluginu **Wake Up Neo** je v poli `longName` a build ho zapíše do `name` vo výslednom `dist/manifest.json`. `src/app-info.ts` sprístupňuje názvy aplikácii aj buildu. Technický názov `name` a verzia sa tiež čítajú z `package.json`.

Firefox rozšírenie s Reactom a TypeScriptom, ktoré pred návštevou vybranej domény zobrazí TOTP blok a otázku „Práve ideš navštíviť Facebook. Čo sa tam chystáš robiť?“. Názov aplikácie sa dosadí z nastavení. Pokračovanie vyžaduje správny šesťmiestny kód z externej TOTP aplikácie a vysvetlenie aspoň piatimi slovami; druhé tlačidlo zavrie aktuálny panel.

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

`npm run build` runs TypeScript checking followed by a production Vite build. Vite clears the output directory, bundles the React application and background script, generates `manifest.json` from `manifest.template.json` and the metadata in `package.json`, and generates the icon and CSS variables through `design-tokens.plugin.ts` using `src/tokens.json`.

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

Submit a separate ZIP of the matching source tree, including this README, `package.json`, `package-lock.json`, `src/`, `manifest.template.json`, `scripts/`, `tests/`, HTML entry files, and all build, TypeScript, ESLint and formatting configuration files. Exclude `node_modules/`, `dist/`, `.git/`, IDE settings and generated release archives. Attach the matching source archive to each submitted version.

Mozilla's [source code submission requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/) explicitly recommend including build instructions in a README shipped with the sources.

## Náhľad na localhoste

Projekt používa Node.js 24; testy priamo importujú TypeScript súbory a na Node.js 20 sa nespustia. Verzia pre vývoj je uložená v `.nvmrc`. Ak používaš [nvm](https://github.com/nvm-sh/nvm), v koreňovom adresári projektu spusti:

```sh
nvm install
nvm use
```

V PyCharme vyber rovnaký Node.js 24 interpreter aj pre npm konfigurácie. Over ho cez `node --version` v termináli, z ktorého spúšťaš príkazy.

```sh
npm install
npm run dev
```

- Otázka: http://localhost:5173/
- Nastavenia: http://localhost:5173/settings.html

Nastavenia sa v náhľade ukladajú do `localStorage`. Rozšírenie má vlastné oddelené nastavenia vo `browser.storage.local`.

Náhľad umožňuje skúsiť formulár, TOTP overenie aj kontrolu piatich slov. Najskôr pridaj QR kód z náhľadu nastavení do overovacej aplikácie; náhľad má vlastný kľúč oddelený od rozšírenia. Po potvrdení zobrazí úspech; neotvorí cieľovú stránku. Prehliadače bežne nedovolia webovej aplikácii zavrieť panel otvorený ručne; vtedy sa zobrazí pokyn na ručné zavretie. Zachytávanie návštevy domény a zatvorenie panelu fungujú v rozšírení.

## Nastavenia

Klikni na ikonu WakeUp vo Firefoxe alebo otvor nastavenia doplnku v `about:addons`.

Pri prvom spustení sa automaticky vytvorí a uloží jeden spoločný TOTP kľúč pre všetky sledované domény. Nastavenia ho stále zobrazujú ako QR kód aj textový kľúč na ručné pridanie do externej overovacej aplikácie. Používa SHA-1, šesť číslic a 30-sekundový interval podľa [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238); kontrola toleruje jeden susedný interval pre rozdiel hodín. Zmeny domén ani reštart kľúč nemenia. QR kód aj overovanie vznikajú lokálne bez externej služby. Toto je pomôcka na vedomú pauzu, nie zabezpečenie.

Názov aplikácie sa doplní automaticky z domény, napríklad facebook.com → Facebook. Môžeš ho ručne upraviť; vlastný názov sa pri zmene domény zachová. Zoznam možno ľubovoľne rozšíriť a položky odstrániť; prázdny uložený zoznam vypne zachytávanie návštev.

Zmeny potvrď tlačidlom **Uložiť nastavenia**. Pri novej doméne Firefox požiada o prístup k nej. Bez povolenia sa zmeny neuložia. Doména zahŕňa aj subdomény; ak má subdoména vlastný záznam, použije sa jej názov aplikácie.

## Testovanie vo Firefoxe

1. Spusti `npm run build`.
2. Otvor `about:debugging#/runtime/this-firefox`.
3. Klikni na **Načítať dočasný doplnok** a vyber `dist/manifest.json`.
4. Klikni na ikonu rozšírenia, naskenuj QR kód do externej TOTP aplikácie a nastav domény. Predvolený zoznam obsahuje Facebook.
5. V novom paneli otvor sledovanú doménu. Namiesto nej sa zobrazí obrazovka WakeUp.
6. **Pokračovať** vyžaduje šesť číslic a aspoň päť slov. Nesprávny alebo vypršaný kód zobrazí chybu; správny kód spolu s odpoveďou umožní návrat na pôvodnú adresu.
7. Odíď na inú doménu a vráť sa: otázka sa zobrazí znova. Nový panel tiež vyžaduje vlastné potvrdenie.
8. **Zavrieť okno** zavrie aktuálny panel s otázkou.

Potvrdenie platí počas návštevy domény v danom paneli. Je uložené len v pamäti prehliadača. Zmena nastavení zruší existujúce potvrdenia. Text vysvetlenia sa neukladá ani neodosiela na server.

Po zmene kódu spusti `npm run build` a pri doplnku v `about:debugging` klikni na **Znovu načítať**. Dočasný doplnok sa po reštarte Firefoxu odstráni.

## Kontroly a formátovanie

Použi Node.js 24 alebo novší, ktorý podporuje priame spúšťanie TypeScript testov.

- `npm run lint` — ESLint pre React a TypeScript.
- `npm run lint:fix` — automatické opravy.
- `npm run format` — formátovanie cez Prettier.
- `npm run format:check` — kontrola formátovania.
- `npm test` — domény, počítanie slov, nastavenia a automatické názvy, TOTP testovacie vektory RFC 6238, schválenie návštevy a správanie background skriptu so simulovanými Firefox API.
- `npm run build` — typová kontrola a zostavenie.

## Štruktúra

- `src/App.tsx` — obrazovka s otázkou; stav a odoslanie formulára rieši `use-visit.ts`.
- `src/visit.ts` — schválenie návštevy a zatvorenie panelu v rozšírení aj náhľade.
- `src/Settings.tsx` — obrazovka nastavení; načítanie, úpravy a uloženie rieši `use-domain-settings.ts`.
- `src/DomainRuleEditor.tsx` — samostatný riadený editor jednej domény a názvu aplikácie.
- `src/domain-draft.ts` — pracovné riadky nastavení, automatické názvy a prevod na uložené pravidlá.
- `src/TextField.tsx`, `src/Icon.tsx`, `src/ErrorMessage.tsx` — spoločné UI prvky; polia automaticky prepájajú label s jedinečným ID vstupu.
- `src/settings-store.ts` — ukladanie nastavení.
- `src/totp.ts` — generovanie kľúča, provisioning URI a overovanie TOTP.
- `src/TotpSetup.tsx` — QR kód a textový kľúč v nastaveniach.
- `src/policy.ts` — validácia domén, výber sledovanej domény a počítanie slov.
- `src/background.ts` — zachytenie navigácie a dočasné potvrdenia.
- `manifest.template.json` — šablóna Firefox oprávnení a nastavení doplnku; build doplní názov, verziu a identifikátor z `package.json`.

Identifikátor rozšírenia sa generuje ako `@${name}.wondercules` z poľa `name` v `package.json` a zapíše sa do `browser_specific_settings.gecko.id`. Zmena technického názvu zmení identitu doplnku vo Firefoxe; po publikovaní ho zachovaj aj pri ďalších verziách.

## Jazyky a preklady

Texty hlavnej aplikácie aj nastavení vrátane validačných hlášok sú v `src/locales.json`. Každý jazyk má vlastný kód, zobrazovaný názov `name` a slovník `messages`. Zoznam v nastaveniach sa vytvára z tohto súboru automaticky. Ďalší jazyk pridáš skopírovaním existujúceho záznamu pod nový kód a preložením hodnôt; zachovaj rovnaké kľúče a parametre ako `{count}`, `{site}` či `{domain}`. Úplnosť slovníkov a parametre overujú testy.

V komponentoch použi `const { t } = useLanguage()` a napríklad `t('saveSettings')` alebo `t('reasonTooShort', { count: 5 })`. Voľba jazyka sa v nastaveniach okamžite zobrazí ako náhľad. Tlačidlo uloženia ju zapíše do `browser.storage.local` v rozšírení alebo do `localStorage` v náhľade a aktualizuje aj ostatné otvorené stránky aplikácie. Predvolený jazyk je slovenčina; používa sa aj pri neznámom alebo odstránenom jazyku.

Jednotlivé skupiny nastavení používajú `SettingsBlock` so spoločným sivým pozadím, nadpisom a vysvetlením.

## Dizajnové tokeny

Všetky farby, veľkosti a hrúbky písma, rodiny písma, riadkovanie, hrúbky okrajov a ikon, zaoblenia, rozostupy a tiene sú definované v `src/tokens.json`. Nové vizuálne hodnoty pridávaj do tohto súboru; v komponentoch ani štýloch nezadávaj priame hodnoty.

V CSS použi napríklad `color: var(--palette-gray-900)` a `font-size: var(--font-size-small)`. V TypeScripte importuj `tokens` zo súboru `tokens.json` a použi napríklad `tokens['palette-green-400']`. To isté platí pre SVG ikony aj vykresľovanie Matrix pozadia do canvasu.

Vite plugin `design-tokens.plugin.ts` vytvorí z tokenov CSS premenné a ikonu rozšírenia. Responzívny variant `@media (--compact)` používa hodnotu `breakpoint-compact` z tokenov. Vygenerované hodnoty v `dist` neupravuj ručne.

`npm run lint` kontroluje priame dizajnové hodnoty v Reacte a TypeScripte aj používanie tokenov v CSS. Samostatnú kontrolu CSS spustíš cez `npm run check:tokens`. Štrukturálne hodnoty ako `0`, `100%`, súradnice SVG a dedenie štýlov zostávajú povolené.
