# Chrome Web Store listing

Everything the Chrome Web Store developer dashboard asks for, in the order of its tabs. Images are in this folder; `apps/extension/scripts/store-screenshots.ts` regenerates them from the built extension and the live https://coss.com/ui (`pnpm build`, then `node scripts/store-screenshots.ts` in `apps/extension`).

## Package

```bash
pnpm install --frozen-lockfile
pnpm build
(cd apps/extension/dist && zip -r ../cossplay-v0.1.0.zip .)
```

Upload `apps/extension/cossplay-v0.1.0.zip`. The zip has `manifest.json` at its root, as the store requires; it is the same archive the `chrome-extension-release.yml` workflow attaches to a `v*` GitHub release. Each later upload needs a higher `version` in `apps/extension/package.json` (the manifest takes its version from there).

The version is 0.1.0 because the tags `v0.0.1` to `v0.0.4` already belong to releases of the earlier coss-ui-theme-tweak build, so 0.0.3 could not be tagged and released from this code.

## Store listing tab

**Name**: Cossplay

**Summary** (from the manifest `description`, 132 characters max; the manifest's is used as is):

> Live-edit coss ui theme variables on any website, from your side panel.

**Description**:

```text
Cossplay live-edits the theme of a website built with coss ui (or any site that uses shadcn-style CSS variables) from Chrome's side panel. Changes show on the page as you make them, and only on your screen.

Open a coss ui site, click the Cossplay icon and the side panel reads the site's own theme: colors on :root, .dark and [data-theme], plus fonts, radius, spacing, letter spacing and shadows.

- 43 presets: coss ui's default theme and 42 tweakcn presets. Step through them or shuffle.
- Color editing in HEX, OKLCH, HSL or RGB, with a color picker, Tailwind palette, channel sliders and opacity. Values are written back in the site's own color format.
- Light and dark mode, edited separately; preview either mode on the page.
- Inspect: hover an element on the page to see which theme tokens it uses, click one to edit it.
- Global hue, saturation and lightness adjustments.
- Typography: font stacks with Google Fonts search, letter spacing.
- WCAG contrast checks for 15 color pairs.
- Undo and redo for every edit.
- Import a theme from a tweakcn or shadcn registry URL, pasted CSS or JSON, or a file.
- Export Tailwind v4 (OKLCH) or v3 (HSL) CSS, registry JSON, token JSON, a Tailwind v3 config or a Next.js font layout. Unedited presets also show a shadcn CLI install command.
- Saved per site, with an on/off switch; restored before the page paints when you come back.

Only the tokens you edit are injected; everything else keeps following the site. Nothing is uploaded: themes stay in Chrome's local extension storage, there is no account and no server.

The same editor runs without the extension at https://cossplay.vercel.app/editor.

Not affiliated with coss, tweakcn or shadcn/ui. Presets come from tweakcn (Apache-2.0).
```

**Category**: Developer Tools

**Language**: English

**Graphics**:

| Field                         | File                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Store icon (128x128)          | `apps/extension/public/icons/icon-128.png`                                                                          |
| Screenshots (1280x800)        | `screenshot-1-presets.png`, `screenshot-2-dark-channels.png`, `screenshot-3-inspect.png`, `screenshot-4-export.png` |
| Small promo tile (440x280)    | `promo-small-440x280.png`                                                                                           |
| Marquee promo tile (1400x560) | `promo-marquee-1400x560.png`                                                                                        |

**Official URL**: none (needs a site verified in Search Console). **Homepage URL**: https://cossplay.vercel.app. **Support URL**: https://github.com/iamdin/cossplay/issues.

## Privacy tab

**Single purpose**:

> Cossplay edits the CSS theme variables (colors, fonts, radius, shadows) of the website in the current tab from the side panel, so a developer can try and export a theme for a coss ui or shadcn-style site.

**Permission justifications**:

| Permission                                   | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sidePanel`                                  | The editor is a side panel next to the page it edits; clicking the toolbar icon opens it.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `storage`                                    | Saves each site's theme edits, on/off switch, undo history and picked Google font stylesheets in `chrome.storage.local`, so edits survive reloads. Nothing is synced or uploaded.                                                                                                                                                                                                                                                                                                                                                          |
| `tabs`                                       | The side panel follows the active tab of its window (`tabs.query`, `tabs.onActivated`, `tabs.onUpdated`) and reads its URL to know which site's theme to load, connects to the tab's content script for messaging and inspect mode, and shows "Open an HTTP(S) website" on other pages.                                                                                                                                                                                                                                                    |
| `scripting`                                  | Injects the edited theme variables as a user-origin stylesheet (`scripting.insertCSS` / `removeCSS`) so they win over the site's own CSS, and registers a tiny script (`scripting.registerContentScripts`) only for sites the user has edited, which hides the page for at most 1.5 s while the saved theme is restored, to avoid a flash of the original theme.                                                                                                                                                                           |
| Host permissions `http://*/*`, `https://*/*` | The extension's purpose is editing the theme of whichever site the user opens, which can be any domain, including localhost and staging hosts, so the hosts cannot be listed in advance. The content script reads the page's CSS variables and applies the user's edits; injected CSS needs host access to the tab; and the service worker fetches the page's cross-origin stylesheets (which the page's CSSOM cannot read) to find its theme. On sites the user has not edited, the extension only reads stylesheets and changes nothing. |

**Remote code**: No, I am not using remote code. (The service worker fetches CSS text and theme JSON as data: Google Fonts stylesheets, theme URLs the user pastes into Import, and the current page's stylesheets. No JavaScript is fetched or evaluated.)

**Data usage**: check none of the data categories. Theme edits are stored only in the browser's local extension storage and never leave the device; page stylesheets are read locally to detect the theme. The only network requests are those the user triggers or the page already makes: Google Fonts CSS for a font the user picks (`fonts.googleapis.com`, with font files from `fonts.gstatic.com`), an import URL the user enters, and the visited page's own stylesheets. All are sent without cookies (`credentials: "omit"`).

Certify all three:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**: https://cossplay.vercel.app/privacy

## Distribution tab

Free, public, all regions.

## Submit

1. Register as a Chrome Web Store developer at https://chrome.google.com/webstore/devconsole with a Google account: pay the one-time US$5 fee, and verify the contact email in **Account**.
2. **Items → New item**, upload `apps/extension/cossplay-v0.1.0.zip` (see Package).
3. Fill **Store listing**, **Privacy** and **Distribution** from this file and upload the images. Make sure https://cossplay.vercel.app/privacy is live first.
4. **Submit for review**. Leave "publish automatically after review" on, or turn it off to publish by hand.
5. For updates: bump the version, build, zip, then **Package → Upload new package** on the item and submit again.

## Expected review concerns

- **Broad host permissions** (`http://*/*`, `https://*/*` plus a content script on all sites) trigger an in-depth review, which can take noticeably longer than a normal one. The host permission justification answers it directly: the single purpose is editing whichever site the user opens, on domains unknown in advance; host access is used to read the page's CSS variables, inject the edited variables and read cross-origin stylesheets; nothing is collected or sent anywhere. If the review asks for narrower access, the alternative is `activeTab` plus optional host permissions granted per site, which would lose restoring a saved theme before first paint on reload; that is a code change, not a listing change.
- **`tabs`**: with host permissions for all HTTP(S) sites, the tab URL is already readable, so a reviewer may ask why `tabs` is needed. Its only extra effect is reading URLs of non-HTTP tabs (for example `chrome://`), which the panel uses solely to say it cannot edit them. Dropping `tabs` would avoid the question; the panel would then show the same message for those tabs, since their URL reads as empty.
- **Remote resources**: Google Fonts CSS is fetched and stored, but it is CSS, not code, and only for a font the user picks.
