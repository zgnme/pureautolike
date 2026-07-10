# Telegram Diagnostics, Shared Counter, And Faster AutoLike

## Goal

Improve three concrete behaviors without adding profile filters, artificial rate
limits, schedules, or expanded Telegram product features:

1. Make Telegram test failures self-explanatory and reliable.
2. Keep the current session like count live across every open Pure tab and popup.
3. Increase autolike throughput by removing avoidable UI and timer latency while
   retaining browser-level CDP mouse events and sequential click confirmation.

## Non-Goals

- No new Pure profile filters.
- No daily limits, randomized long pauses, or activity schedules.
- No Telegram digests, remote commands, or notification templates.
- No parallel clicking and no direct Pure API calls that perform likes.
- No changes to billing or license behavior.

## 1. Telegram Self-Test

### Behavior

The existing Test Telegram button runs a three-stage diagnostic in the background
service worker:

1. `getMe` validates the bot token.
2. `getChat` validates that the configured chat is visible to that bot.
3. `sendMessage` sends the existing PureAutoLike test message.

The result contains a stable stage name, HTTP status when available, Telegram's
description, and a short user-facing message. Tokens must never appear in stored
state, UI text, logs, or returned errors.

### State And UI

The background stores only the latest redacted test result under a dedicated
storage key. The popup shows the complete result in a wrapping status block so
the one-second status refresh cannot overwrite it immediately. Editing Telegram
credentials clears the stale test result.

### Failure Handling

- Token format failure stops before network access.
- `getMe` failure is reported as a token-stage failure.
- `getChat` failure is reported as a chat-stage failure.
- `sendMessage` failure is reported as a delivery-stage failure.
- Network/JSON failures retain the stage that failed.

## 2. Shared Live Session Counter

### Source Of Truth

`palSessionStats` remains the shared persisted session record. The runner tab is
the only writer of like/failure increments. Other Pure tabs subscribe to changes
for this key and mirror newer values into their local runtime and page badge.

The popup reads the shared stats directly for counts. It continues querying the
active Pure tab for tab-local state such as runner ownership, token readiness,
timers, and errors. This prevents a chat tab's stale local count from replacing
the runner's global count.

### Conflict Rules

- A non-runner tab always accepts a newer shared `updatedAt` value.
- The runner does not replace an in-memory count with an older storage event.
- Starting a new explicit session resets the shared record once.
- Storage propagation should make secondary tabs current within the existing
  roughly 700 ms stats flush window.

## 3. Faster Sequential AutoLike

### Click Path

Keep CDP `Input.dispatchMouseEvent` so clicks remain browser-level trusted input.
Reduce the default movement path from seven delayed interpolation steps to one
`mouseMoved` event, followed by press and release with an 8 ms delay. Retain
point jitter and the DOM-click fallback for browsers without the debugger API.

### Avoid Unnecessary Scrolling

Detected candidates are already visible. Before calling `scrollIntoView`, verify
whether the current jittered/center point is inside the viewport and targets the
button. Scroll and wait for layout only when that check fails.

### Event-Driven Continuation

After a successful click, schedule the next processing pass through one coalesced
`queueMicrotask` scheduler rather than the current fixed 20 ms plus 35 ms timer
chain. Only one processing pass may be in flight. Feed/DOM mutations request a
new pass. A 1-second watchdog remains only for scrolling or missed mutations.

Clicks remain sequential. Each candidate must still pass point validation and
reaction confirmation before the next candidate is accepted. Failed confirmation
retains one controlled retry.

### Hidden Tabs

The design minimizes chained short timers because Chrome throttles them in hidden
tabs. It does not attempt to bypass browser policy with audio, WebRTC, command-line
flags, or an offscreen document. DOM/network events drive progress where possible.

## Component Changes

- `src/background.js`: staged Telegram diagnostic, redacted result persistence,
  faster CDP movement defaults.
- `src/popup.js`: run/render staged diagnostic, read shared session counts, avoid
  overwriting test state.
- `src/popup.css`: wrap diagnostic errors instead of ellipsizing them.
- `src/content.js`: consume shared stats changes, optimize click preparation, add
  coalesced event-driven runner scheduling.
- `tests/background-fixtures.mjs`: Telegram stage success/failure coverage and
  redaction assertions.
- `tests/runner-fixtures.mjs`: shared counter, single-in-flight scheduling, and
  click preparation invariants.
- `package.json`: include the runner fixture in `npm run validate`.
- `tests/validate-extension.mjs`: structural/build invariants where appropriate.

## Validation

Required checks:

- `npm run validate`
- `npm run audit:clean`
- `npm --prefix backend/license-worker run check`
- `git diff --check`

Manual browser scenarios:

1. Invalid token identifies `getMe` without exposing the token.
2. Valid token plus inaccessible chat identifies `getChat`.
3. Valid configuration produces a received test message.
4. Runner in tab A updates the popup and badge while tab B is active.
5. Returning to tab A does not jump the count backward.
6. Foreground and background autolike sessions retain correct sequential counts.
7. DOM-click fallback still works in a build without `debugger` permission.

## Success Criteria

- Telegram test names the failing stage and keeps the full error visible.
- No Telegram credential appears in diagnostic state or test output.
- All open Pure tabs display the same session count within one stats flush.
- The popup count is independent of which Pure tab is active.
- The optimized runner removes avoidable scrolling and short timer delays without
  introducing parallel clicks, duplicate counts, or missed confirmation.
