# Privacy, Security, And Code Cleanliness

PureAutoLike is intentionally distributed as a small browser extension. This file
documents what the extension does with sensitive browser/session data and what is
kept out of the public package.

## Data Flow

- The extension content script runs only on `pure.app`; the injected page bridge
  can use Pure API/CDN requests already available to the active Pure session, and
  the background script contacts Telegram Bot API only when Telegram
  notifications are enabled.
- Settings are stored in browser extension storage.
- The background script contacts the PureAutoLike license endpoint for beta
  access and future subscription checks. Requests include a locally generated
  installation id, the extension id, version, and release channel.
- Telegram bot token and chat id are stored in browser extension storage only;
  they are sent to Telegram Bot API only for test and event notifications.
- Profile status, age, and descriptions are stored in browser extension storage
  only when the optional analysis mode is enabled. They are exported only
  through the manual Markdown export button and kept until the user clears them
  or the browser's local storage capacity is reached.
- The Pure authorization header is observed by the page bridge from the active
  Pure page at runtime and kept in page-bridge memory only.
- The runtime authorization value is used only by the page bridge for Pure
  API/CDN requests needed by the hidden photo opener. It is not posted to the
  content script or background script.
- The extension does not include an external analytics endpoint or telemetry
  service. The hosted license worker stores installation/license-check metadata
  and does not receive Pure account credentials or Pure profile exports.

## What Is Not Stored

- No hardcoded Pure account tokens.
- No GitHub tokens.
- No OpenAI/API keys.
- No private keys.
- No local developer paths.
- No user credentials in source files or generated packages.

## Permissions

`storage`
: Saves extension settings such as enabled state, click offset, and optional
Telegram notification settings. When the optional analysis mode is enabled, it
also stores collected profile status, age, and descriptions locally for manual
Markdown export.

`unlimitedStorage`
: Chromium and Firefox builds only. Allows larger local Markdown-research
datasets without an artificial extension-side profile count cap. It does not
grant network access and does not upload collected descriptions anywhere.

`tabs`
: Allows the extension popup and background script to target the active Pure tab.

`debugger`
: Chromium build only. Used for coordinate mouse events through the official
Chromium debugger API. Firefox and Safari builds omit this permission and fall
back to DOM clicks.

Host permissions
: Limited to Pure web, the PureAutoLike license endpoint, and Telegram Bot API
for optional notifications. Pure API/CDN photo requests are made from the
injected page bridge inside the active Pure page session instead of through
broad extension host permissions.

## Audit Commands

Run the local validation and cleanliness checks before publishing:

```bash
npm run validate
npm run audit:clean
```

The cleanliness audit checks for local developer paths and common secret/token
patterns in repository text files. Runtime code still contains words such as
`Authorization` because the page bridge must reuse the current Pure session
header while opening photos; this is expected and not a committed secret.

## Publishing Boundary

The current GitHub tree is extension-only. The previous desktop app, FastAPI
backend, MCP surface, chat-history analysis, full network monitor, SQLite
storage, and system tray behavior are not part of this public distribution.
