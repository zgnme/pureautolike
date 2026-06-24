# PureAutoLike Install And Release Notes

This repository contains the lightweight beta browser extension version.

## Public Distribution

Public user installs should go through the published Chrome Web Store listing:
[PureAutoLike](https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm).

Chrome Web Store extension id:
`abamkpcdpihjpaomdpaklhifpfbobgmm`.

GitHub is used for source code, feedback, transparency, and maintainer release
artifacts, not as the primary user install funnel.

Packaged builds still contact the PureAutoLike license endpoint before starting
the runner. While beta is enabled, the backend returns beta access. When beta is
disabled later, updated builds can be blocked unless the backend returns an
active subscription.

Firefox and Safari builds are generated for maintainer/testing use, but they are
not public one-click install channels yet. Public Firefox/Safari distribution
requires signed store packages and the cross-browser subscription model in
[docs/cross-browser-subscriptions.md](docs/cross-browser-subscriptions.md).

## Maintainer Build

```bash
npm run build
npm run package
npm run validate
npm run audit:clean
```

Generated target folders are written to `dist/`.
Release ZIP files are written to `packages/`.

## Local Development Loading

Use local loading only for development or store-review checks:

- Chromium: open `chrome://extensions`, enable Developer mode, click `Load
  unpacked`, and select `dist/chromium`.
- Firefox: open `about:debugging#/runtime/this-firefox`, click `Load Temporary
  Add-on`, and select `dist/firefox/manifest.json`.
- Safari: package `dist/safari` through the Safari Web Extension flow.

Local development installs use a different extension id than the Chrome Web
Store listing. Browser extension storage does not migrate between those ids, so
local test settings such as Telegram bot token and chat id should be treated as
separate from the store-installed extension.
