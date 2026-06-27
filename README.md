# PureAutoLike

<p align="center">
  <img src="docs/assets/pureautolike-github-hero.png" alt="PureAutoLike browser extension hero" width="100%">
</p>

<p align="center">
  <strong>Beta browser extension for Pure Web: local auto-like flow, hidden photo opener, Telegram alerts, and subscription-ready license checks.</strong>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm"><strong>Chrome Web Store</strong></a>
  ·
  <a href="https://zgnoff.github.io/pureautolike/"><strong>Website</strong></a>
  ·
  <a href="https://zgnoff.github.io/pureautolike/en/"><strong>SEO EN</strong></a>
  ·
  <a href="https://zgnoff.github.io/pureautolike/ru/"><strong>SEO RU</strong></a>
  ·
  <a href="https://zgnoff.github.io/pureautolike/en/pure-autolike/"><strong>Pure autolike</strong></a>
  ·
  <a href="https://zgnoff.github.io/pureautolike/ru/pure-avtolayk/"><strong>Pure автолайк</strong></a>
  ·
  <a href="README.en.md"><strong>English</strong></a>
  ·
  <a href="README.ru.md"><strong>Русский</strong></a>
  ·
  <a href="https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm"><strong>Install</strong></a>
  ·
  <a href="PRIVACY.md"><strong>Privacy</strong></a>
  ·
  <a href="SECURITY.md"><strong>Security</strong></a>
  ·
  <a href="FEEDBACK.md"><strong>Feedback</strong></a>
</p>

<p align="center">
  <img alt="Beta" src="https://img.shields.io/badge/status-free%20beta-ff0a68?style=flat-square">
  <a href="https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm"><img alt="Chrome Web Store" src="https://img.shields.io/badge/install-Chrome%20Web%20Store-111111?style=flat-square"></a>
  <img alt="Pure auto liker" src="https://img.shields.io/badge/search-Pure%20auto%20liker-ff0a68?style=flat-square">
  <img alt="WebExtension" src="https://img.shields.io/badge/platform-WebExtension-111111?style=flat-square">
  <img alt="Local first" src="https://img.shields.io/badge/storage-local%20settings-f5f5f5?style=flat-square&labelColor=111111">
  <img alt="No analytics" src="https://img.shields.io/badge/analytics-none-32d74b?style=flat-square&labelColor=111111">
</p>

PureAutoLike keeps Pure Web automation inside the browser profile where Pure is
already open. It is built for one job: remove repetitive feed work without a
separate desktop app, extra tray process, or heavyweight control panel.

Keep Pure open. Let the boring likes run. React faster when something actually
happens.

## What It Does

| Feature | What it means |
| --- | --- |
| Fast auto-like flow | Finds visible Pure like controls and runs the local click flow inside the active browser profile. |
| Duplicate guard | Avoids re-clicking the same visible profile during the current session. |
| Hidden photo opener | Adds a page control for Pure hidden-photo placeholders when the active web session already has access. |
| Telegram alerts | Optional notifications for new Pure matches, likes, and messages. |
| Profile notes export | Optional local capture of visible status, age, and description, exported manually as Markdown. |
| Beta license check | Free beta access now, with a backend path ready for future paid subscription enforcement. |

<p align="center">
  <img src="docs/assets/pureautolike-workflow-visual.png" alt="PureAutoLike browser workflow visual" width="100%">
</p>

## Why It Is Small On Purpose

Generic autoclickers do not understand the Pure feed. Large desktop automation
apps add another process, another installation path, and another interface to
manage. PureAutoLike takes the smaller route: a focused WebExtension that runs
where the Pure session already lives.

```mermaid
flowchart LR
  A["Pure Web tab"] --> B["Content script"]
  B --> C["Local popup controls"]
  B --> D["Auto-like runner"]
  B --> E["Hidden photo opener"]
  D --> F["Browser storage"]
  C --> G["Optional Telegram alerts"]
  C --> H["License endpoint"]
```

## Browser Support

| Target | Status |
| --- | --- |
| Chrome / Chromium / Edge / Brave / Opera / Arc / Yandex Browser | Recommended build. |
| Firefox | Supported with DOM-click fallback. |
| Safari | Safari Web Extension source is included; Safari packaging is separate. |

Chrome Web Store is the only public install channel right now. Firefox and
Safari support are present in the source/build system, but they should become
public only through signed Mozilla Add-ons / Safari App Store releases or a
backend subscription flow that can identify the same paid user across browsers.
Cross-browser subscription requirements are tracked in
[docs/cross-browser-subscriptions.md](docs/cross-browser-subscriptions.md).

The extension behaves inside the browser profile where it is installed. If Pure
is already used through a managed Chromium profile, PureAutoLike inherits that
profile's cookies, proxy, timezone, fingerprint, and network rules. It does not
provide anti-detect functionality by itself.

## Privacy Position

- Settings are stored in browser extension storage.
- Telegram bot token and chat id stay in extension storage and are sent only to
  Telegram Bot API when Telegram alerts are enabled.
- Profile status, age, and descriptions are stored locally only when the optional
  capture mode is enabled.
- The Pure authorization header can be observed inside the active Pure page at
  runtime for photo-opening requests, but it is not stored in extension settings.
- The extension does not include third-party analytics.

Read the full policy: [PRIVACY.md](PRIVACY.md)

## Beta And Future Paid Access

The current public build is beta. The extension already contacts a lightweight
PureAutoLike license endpoint, so beta access can be turned into paid access
later without shipping a completely different product model.

GitHub release ZIPs and Chrome Web Store builds can both check the license
endpoint. Local unpacked installs can still run extension code, but production
access can be controlled by the backend when beta mode is disabled.

## Important Limits

PureAutoLike reduces manual feed work. It does not guarantee matches, replies,
account reach, ranking, moderation state, or geolocation behavior inside Pure.
Use it responsibly and follow the rules of the services you use.

## Install

Install the published Chrome/Chromium build from the Chrome Web Store:
[PureAutoLike](https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm).

GitHub is used for source transparency, feedback, and maintainer release
artifacts. Store installation is the primary public install path.

Maintainer notes: [INSTALL.md](INSTALL.md)

```bash
npm run build
npm run package
npm run validate
npm run audit:clean
```

Generated folders are written to `dist/`. Release ZIP files are written to
`packages/`.

## Public Marketing Notes

The GitHub presentation plan and real-render asset sources are documented in
[docs/github-marketing-plan.md](docs/github-marketing-plan.md). Search/indexing
notes live in [docs/seo-indexing.md](docs/seo-indexing.md).

## Repository Shape

This repository intentionally contains the browser extension distribution plus
the lightweight license worker used for beta access and future subscriptions.
It is scoped as a browser-extension product, not a desktop automation suite.
