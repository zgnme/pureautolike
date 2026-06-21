# PureAutoLike Extension: Fast Local Auto-Liking For Pure Web

PureAutoLike is a lightweight beta browser extension for Pure Web users who want
a focused automation tool without installing a separate desktop application.

It does four things well: finds visible like buttons, clicks them quickly inside
the active browser profile, opens hidden Pure photos when the current web
session has access, and optionally sends Telegram alerts for new matches, likes,
and messages. It also has an optional local research mode that collects visible
profile status, age, and descriptions, then exports them as Markdown for later
AI analysis.
Everything else was intentionally removed from the public extension package so
the product stays small, understandable, and easy to audit. The current build
uses a remote license check for free beta access and future subscriptions.

## Why It Exists

Most auto-clicking setups are either too generic or too heavy. A generic
autoclicker does not understand the Pure feed and can miss cards, click the wrong
control, or repeat the same profile. A desktop automation app can be powerful,
but it also adds another process, another UI, and another installation step.

PureAutoLike takes the smaller route: it runs as a WebExtension directly inside
the browser profile where Pure is already open. That makes setup lighter and
keeps the automation close to the page it controls.

## Core Features

- Fast Pure feed auto-liker for visible profile cards.
- Session duplicate guard so the same visible profile is not clicked again.
- Humanized mouse path and click-point jitter on Chromium builds.
- CDP-level mouse events through the official Chromium `debugger` API when
  available.
- DOM-click fallback for Firefox, Safari, and browsers without debugger support.
- Hidden photo opener for Pure web placeholders.
- Single-runner tab lock so duplicate Pure tabs do not run a second autoliker.
- Duplicate-tab chat history baseline so old Pure messages are not resent to
  Telegram when a tab is cloned or reloaded.
- Optional timers that can stop the autoliker or close the current Pure tab
  after a selected number of minutes.
- Optional Telegram alerts for new Pure matches, messages, and likes.
- Optional Markdown export of collected profile status, age, and descriptions
  for AI review.
- Small popup with only the controls needed to run the extension.

## Regular Browser vs Anti-Detect Profile

The extension package is the same in both modes. The important difference is the
browser profile that runs it.

| Mode | How it behaves |
| --- | --- |
| Regular Chrome/Chromium | Best for a simple personal setup. PureAutoLike uses the current Pure login, current cookies, local extension storage, and the normal browser network identity. |
| Anti-detect Chromium profile | Best when Pure is already operated through a managed profile. Install the extension inside that profile and it inherits the profile's proxy, fingerprint, timezone, WebRTC/DNS rules, cookies, and other profile-level settings. |

PureAutoLike is not an anti-detect browser and does not create a fingerprint or
proxy layer by itself. It controls the Pure page inside the profile where it is
installed. Anti-detect behavior should be configured in the anti-detect profile;
the extension then works on top of that environment.

## What Was Removed

This extension package does not include the old desktop application. It includes
a lightweight remote license check for beta access and future subscriptions, but
does not include a FastAPI backend, MCP server, chat-history analysis, full
network monitor, SQLite database, or system tray behavior.

That is intentional. The public repository is designed around a small browser
extension, not a full automation suite.

## Privacy And Security Positioning

PureAutoLike uses a lightweight remote license endpoint for beta access and
future subscriptions, and does not send data to analytics services. Its extension
host permissions are limited to the Pure web app, the PureAutoLike license
endpoint, and Telegram Bot API when the user enables Telegram alerts. The
injected page bridge can reuse Pure API/CDN requests already available inside
the active Pure page session for photo opening, without granting broad API/CDN
host permissions to the extension package.

The extension reads the current Pure authorization header from the active page at
runtime so it can open photos that the logged-in web session can access. That
token stays inside the page bridge memory and is not stored in extension
settings or posted to the content/background scripts. User settings are stored
in browser extension storage, including the Telegram bot token and chat id if
the user enters them in the popup. Profile status, age, and
descriptions are stored in that same local extension storage only when the
optional research mode is enabled, and they are exported only when the user
clicks the Markdown export button. The extension no longer applies a fixed
profile-count cap; practical capacity depends on the browser's local extension
storage.

Read the full privacy policy: [PRIVACY.md](PRIVACY.md)

Read the code cleanliness note: [SECURITY.md](SECURITY.md)

## Browser Support

- Chrome / Chromium / Edge / Brave / Opera / Arc / Yandex Browser: recommended.
- Chromium browser profiles: supported through unpacked extension loading.
- Firefox: supported through the Firefox build, with DOM-click fallback.
- Safari: supported as Safari Web Extension source, with Safari packaging
  required.

## Installation

Public user distribution is planned through the Chrome Web Store beta listing.
GitHub is used for source, feedback, transparency, and maintainer release
artifacts. Packaged builds still contact the PureAutoLike license endpoint, so
future paid access can be enforced by the backend after beta mode is disabled.

Open the maintainer install notes: [INSTALL.md](INSTALL.md)

For maintainers, `npm run package` rebuilds the browser targets and refreshes
the release ZIP files in `packages/`.

## Good Search Queries

PureAutoLike is designed for users searching for:

- Pure auto liker extension
- Pure browser extension
- Pure hidden photo opener
- Pure Web automation
- Pure Telegram notifications
- Chrome extension for Pure
- lightweight Pure autoliker

The wording is kept natural instead of keyword-stuffed so the article remains
readable for people and clear for search engines.
