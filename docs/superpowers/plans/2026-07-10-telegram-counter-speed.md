# Telegram Diagnostics, Shared Counter, And Faster AutoLike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a staged Telegram self-test, synchronize the current session count across Pure tabs, and remove avoidable timer/scroll/CDP latency from sequential autoliking.

**Architecture:** Keep the existing content/background/popup boundaries. Background owns Telegram network diagnostics and CDP input; `palSessionStats` remains the persisted global session snapshot; content tabs mirror that snapshot and run one coalesced event-driven liker pass at a time. No new runtime dependencies are added.

**Tech Stack:** Manifest V3, vanilla JavaScript, Chrome/Firefox/Safari extension APIs, Node.js VM fixture tests.

## Global Constraints

- No new Pure profile filters.
- No daily limits, randomized long pauses, or activity schedules.
- No Telegram digests, remote commands, or notification templates.
- No parallel clicking and no direct Pure API calls that perform likes.
- No changes to billing or license behavior.
- Telegram credentials must never appear in diagnostic state, UI errors, test output, or logs.
- Preserve every pre-existing unstaged user change. Stage implementation hunks interactively and inspect `git diff --cached` before every commit.

---

## File Structure

- `src/background.js`: Telegram Bot API diagnostics and fast CDP input.
- `src/popup.js`: diagnostic rendering and global session-count rendering.
- `src/popup.css`: multiline Telegram diagnostic presentation.
- `src/content.js`: shared session mirroring, click preparation, and event-driven runner scheduling.
- `tests/background-fixtures.mjs`: staged Telegram and CDP command fixtures.
- `tests/runner-fixtures.mjs`: focused VM tests for shared stats and click preparation.
- `tests/validate-extension.mjs`: static invariants for the new interfaces.
- `package.json`: run the focused runner fixture from `npm run validate`.

### Task 1: Staged Telegram Self-Test

**Files:**
- Modify: `tests/background-fixtures.mjs:20-213`
- Modify: `src/background.js:1-19, 483-666, 774-820`
- Modify: `src/popup.js:21-47, 289-373, 395-404, 571-610, 693-710, 745-763`
- Modify: `src/popup.css:639-660`
- Modify: `tests/validate-extension.mjs:91-121, 267-293`

**Interfaces:**
- Produces: `runTelegramDiagnostic({botToken, chatId, text}) -> Promise<TelegramDiagnostic>`.
- Produces: `TelegramDiagnostic = {ok:boolean, stage:'validate'|'getMe'|'getChat'|'sendMessage'|'complete', status:number, error:string, message:string, checkedAt:string}`.
- Produces runtime messages: `pal-telegram-test`, `pal-telegram-test-clear`, and `pal-telegram-status.test`.
- Consumes: existing `storageGet`, `storageSet`, `storageRemove`, and `sendTelegram` behavior.

- [ ] **Step 1: Extend the background fixture with a controllable Telegram API**

Add a `telegramMode` variable and route mocked Bot API methods independently:

```js
let telegramMode = 'ok';

function telegramMethod(url) {
  return String(url).split('/').pop();
}

function telegramResponse(method) {
  if (telegramMode === 'bad-token' && method === 'getMe') {
    return {ok: false, status: 401, json: async () => ({ok: false, description: 'Unauthorized'})};
  }
  if (telegramMode === 'bad-chat' && method === 'getChat') {
    return {ok: false, status: 400, json: async () => ({ok: false, description: 'Bad Request: chat not found'})};
  }
  if (telegramMode === 'send-failed' && method === 'sendMessage') {
    return {ok: false, status: 403, json: async () => ({ok: false, description: 'Forbidden: bot was blocked by the user'})};
  }
  return {ok: true, status: 200, json: async () => ({ok: true, result: {id: 1, message_id: 1}})};
}
```

Replace the generic Telegram mock return with `return telegramResponse(telegramMethod(value));` and append assertions:

```js
fetchCalls.length = 0;
telegramMode = 'ok';
response = await sendMessage({
  type: 'pal-telegram-test',
  botToken: '123456:ABC_def-123',
  chatId: '987654',
  text: 'PureAutoLike: тестовое уведомление'
});
assert(response.ok && response.stage === 'complete', 'telegram diagnostic must complete all stages');
assert(telegramCalls().map(call => telegramMethod(call.url)).join(',') === 'getMe,getChat,sendMessage',
  'telegram diagnostic must validate token, chat, and delivery in order');
assert(JSON.stringify(store.palTelegramTestState).includes('ABC_def-123') === false,
  'telegram diagnostic state must never store the bot token');

telegramMode = 'bad-chat';
response = await sendMessage({type: 'pal-telegram-test', botToken: '123456:ABC_def-123', chatId: '987654', text: 'test'});
assert(!response.ok && response.stage === 'getChat', 'telegram diagnostic must identify getChat failures');
assert(response.error === 'Bad Request: chat not found', 'telegram diagnostic must preserve Telegram description');
assert(JSON.stringify(response).includes('ABC_def-123') === false, 'telegram diagnostic response must redact token');
```

- [ ] **Step 2: Run the fixture and verify the new test fails**

Run: `node tests/background-fixtures.mjs`

Expected: FAIL because `pal-telegram-test` performs only `sendMessage` and does not return `stage`.

- [ ] **Step 3: Implement the background diagnostic**

Add `TELEGRAM_TEST_STATE_KEY` and these helpers next to the Telegram functions:

```js
const TELEGRAM_TEST_STATE_KEY = 'palTelegramTestState';

function telegramDiagnosticResult(value = {}) {
  return {
    ok: value.ok === true,
    stage: String(value.stage || 'validate'),
    status: Math.max(0, Number(value.status) || 0),
    error: String(value.error || ''),
    message: String(value.message || ''),
    checkedAt: String(value.checkedAt || nowIso())
  };
}

async function telegramApiRequest(botToken, method, payload = {}) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  let body = null;
  try { body = await response.json(); } catch (_) {}
  if (!response.ok || (body && body.ok === false)) {
    return {ok: false, status: response.status || 0, error: String(body && body.description || `Telegram HTTP ${response.status}`)};
  }
  return {ok: true, status: response.status || 200, body};
}

function redactTelegramText(value, botToken = '') {
  const token = String(botToken || '');
  const text = String(value || '');
  return token ? text.split(token).join('[REDACTED]') : text;
}

async function storeTelegramDiagnostic(value) {
  const result = telegramDiagnosticResult(value);
  await storageSet({[TELEGRAM_TEST_STATE_KEY]: result});
  return result;
}

async function runTelegramDiagnostic(message = {}) {
  const botToken = String(message.botToken || '').trim();
  const chatId = String(message.chatId || '').trim();
  const text = String(message.text || '').trim();
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
    return storeTelegramDiagnostic({ok: false, stage: 'validate', error: 'Некорректный Telegram token', message: 'Проверь token от BotFather'});
  }
  if (!chatId) return storeTelegramDiagnostic({ok: false, stage: 'validate', error: 'Telegram Chat ID не указан', message: 'Укажи Chat ID'});
  for (const [stage, method, payload] of [
    ['getMe', 'getMe', {}],
    ['getChat', 'getChat', {chat_id: chatId}],
    ['sendMessage', 'sendMessage', {chat_id: chatId, text: text || 'PureAutoLike: тестовое уведомление', disable_web_page_preview: true}]
  ]) {
    try {
      const result = await telegramApiRequest(botToken, method, payload);
      if (!result.ok) {
        const error = redactTelegramText(result.error, botToken);
        return storeTelegramDiagnostic({ok: false, stage, status: result.status, error, message: error});
      }
    } catch (error) {
      const redacted = redactTelegramText(error.message || String(error), botToken);
      return storeTelegramDiagnostic({ok: false, stage, error: redacted, message: redacted});
    }
  }
  return storeTelegramDiagnostic({ok: true, stage: 'complete', status: 200, message: 'Тест отправлен'});
}
```

Route `pal-telegram-test` to `runTelegramDiagnostic`, keep `pal-telegram-send` on `sendTelegram`, add `pal-telegram-test-clear`, and include stored `test` in `pal-telegram-status`.

- [ ] **Step 4: Make the popup preserve and display the diagnostic**

Add `TELEGRAM_TEST_STATE_KEY`, `let currentTelegramTest = null`, and render helpers:

```js
function telegramTestText(test = {}) {
  if (test.ok) return test.message || t('testSent');
  const stage = test.stage ? `[${test.stage}] ` : '';
  return `${stage}${test.message || test.error || t('testFailed')}`;
}

function renderTelegramTest(test) {
  currentTelegramTest = test && test.checkedAt ? test : null;
  if (!currentTelegramTest) return false;
  setTelegramStatus(telegramTestText(currentTelegramTest), currentTelegramTest.ok ? 'ok' : 'error');
  return true;
}
```

On credential edits, clear `palTelegramTestState`. In the Test handler call `renderTelegramTest(response)`. In `renderTelegramRuntime`, render `status.test` first and return so polling cannot overwrite it. Change CSS to:

```css
.telegram-status {
  min-height: 24px;
  overflow: visible;
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
}
```

- [ ] **Step 5: Add static invariants and run tests**

Add assertions for `runTelegramDiagnostic`, `getMe`, `getChat`, `TELEGRAM_TEST_STATE_KEY`, `renderTelegramTest`, and multiline status CSS to `tests/validate-extension.mjs`.

Run: `node tests/background-fixtures.mjs && node tests/validate-extension.mjs`

Expected: both print their `... validation passed` messages.

- [ ] **Step 6: Commit only new Task 1 hunks**

Run:

```bash
git add -p src/background.js src/popup.js src/popup.css tests/background-fixtures.mjs tests/validate-extension.mjs
git diff --cached --check
git diff --cached
git commit -m "fix: diagnose telegram test delivery"
```

Expected: cached diff contains Task 1 hunks and preserves all unrelated pre-existing changes unstaged.

### Task 2: Shared Live Session Counter

**Files:**
- Create: `tests/runner-fixtures.mjs`
- Modify: `src/content.js:195-245, 2531-2545, 2576-2682`
- Modify: `src/popup.js:341-360, 745-763`
- Modify: `package.json:13`
- Modify: `tests/validate-extension.mjs:122-218, 267-293`

**Interfaces:**
- Produces: `applySharedSessionStats(value) -> boolean`.
- Produces test hook: `__PAL_TEST_HOOKS__.runner.sessionSnapshot()`.
- Consumes: `palSessionStats` storage change objects and existing `normalizeSessionStats`.

- [ ] **Step 1: Create a failing focused runner fixture**

Create `tests/runner-fixtures.mjs` with a VM harness matching the content fixture environment and these assertions after reading `hooks.runner`:

```js
const initial = runner.sessionSnapshot();
assert(initial.likes === 0, 'runner fixture must start with zero likes');
assert(runner.applySharedSessionStats({likes: 42, failures: 3, updatedAt: '2026-07-10T10:00:00.000Z'}),
  'non-runner tab must accept shared session stats');
assert(runner.sessionSnapshot().likes === 42, 'shared stats must update local likes');
runner.setRunnerState({runnerLock: true, likes: 44, failures: 3, updatedAt: '2026-07-10T10:00:01.000Z'});
assert(!runner.applySharedSessionStats({likes: 40, failures: 2, updatedAt: '2026-07-10T09:59:59.000Z'}),
  'runner tab must reject an older shared snapshot');
assert(runner.sessionSnapshot().likes === 44, 'older snapshot must not roll runner count backward');
```

Use this complete harness before the assertions:

```js
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(new URL('..', import.meta.url).pathname);
const source = await readFile(resolve(root, 'src/content.js'), 'utf8');
const hooks = {__enabled: true};
const document = {
  hidden: false,
  querySelector: () => null,
  querySelectorAll: () => [],
  elementFromPoint: () => null,
  documentElement: null,
  body: null
};
const context = {
  __PAL_TEST_HOOKS__: hooks,
  location: {hostname: 'pure.app', href: 'https://pure.app/app/ru/feed', pathname: '/app/ru/feed'},
  navigator: {userAgent: 'Chrome/126.0.0.0', platform: 'test'},
  chrome: {
    runtime: {
      id: 'pal-test',
      getURL: path => path,
      sendMessage: () => {},
      onMessage: {addListener: () => {}},
      lastError: null
    },
    storage: {
      local: {
        get: defaults => Promise.resolve(defaults),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve()
      },
      onChanged: {addListener: () => {}}
    }
  },
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  queueMicrotask,
  MutationObserver: class MutationObserver { observe() {} disconnect() {} },
  Blob,
  URL,
  Math,
  Date,
  JSON,
  String,
  Number,
  Array,
  Object,
  Map,
  Set,
  Promise,
  document,
  innerWidth: 1280,
  innerHeight: 800,
  getComputedStyle: () => ({backgroundImage: 'none'}),
  atob: value => Buffer.from(value, 'base64').toString('binary')
};
context.globalThis = context;
context.window = context;
vm.runInNewContext(source, context, {filename: 'src/content.js'});
const runner = hooks.runner;
assert(runner, 'content test hooks must expose runner helpers');
```

- [ ] **Step 2: Run the runner fixture and verify failure**

Run: `node tests/runner-fixtures.mjs`

Expected: FAIL because `hooks.runner` is undefined.

- [ ] **Step 3: Implement shared-stat application in content**

Add:

```js
function sessionUpdatedAt(value) {
  const parsed = Date.parse(value && value.updatedAt || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function applySharedSessionStats(value) {
  const next = normalizeSessionStats(value);
  const currentAt = sessionUpdatedAt(runtime.sessionStats);
  const nextAt = sessionUpdatedAt(next);
  if (runtime.runnerLock && nextAt < currentAt) return false;
  if (runtime.runnerLock && nextAt === currentAt && next.likes < runtime.likes) return false;
  runtime.sessionStats = next;
  runtime.sessionStatsLoaded = true;
  runtime.likes = next.likes;
  runtime.failures = next.failures;
  updateBadge();
  return true;
}
```

Handle `changes[SESSION_STATS_KEY].newValue` before the `DEFAULTS` filtering loop. Expose a runner test hook with `applySharedSessionStats`, `sessionSnapshot`, and `setRunnerState` only inside the existing enabled test-hook branch.

```js
globalThis.__PAL_TEST_HOOKS__.runner = {
  applySharedSessionStats,
  sessionSnapshot() {
    return {likes: runtime.likes, failures: runtime.failures, stats: {...runtime.sessionStats}};
  },
  setRunnerState(value = {}) {
    runtime.runnerLock = !!value.runnerLock;
    runtime.likes = Number(value.likes) || 0;
    runtime.failures = Number(value.failures) || 0;
    runtime.sessionStats = normalizeSessionStats({
      likes: runtime.likes,
      failures: runtime.failures,
      updatedAt: value.updatedAt || ''
    });
    runtime.sessionStatsLoaded = true;
  }
};
```

- [ ] **Step 4: Make popup counts use shared storage**

Change `renderRuntime` to accept `sharedStats`:

```js
function renderRuntime(status, sharedStats = null) {
  const sessionStats = sharedStats || status.sessionStats || {};
  controls.likes.textContent = String(sessionStats.likes ?? status.likes ?? 0);
  // existing tab-local rendering remains unchanged
}
```

In `refreshStats`, read `{palSessionStats: null}` and pass that value to `renderRuntime`. Do not load full profile capture chunks.

- [ ] **Step 5: Register and run the fixture**

Append `node tests/runner-fixtures.mjs` to the `validate` script. Add static assertions for `applySharedSessionStats` and `changes[SESSION_STATS_KEY]`.

Run: `node tests/runner-fixtures.mjs && npm run validate`

Expected: runner fixture and full validation pass.

- [ ] **Step 6: Commit only new Task 2 hunks**

Run:

```bash
git add tests/runner-fixtures.mjs package.json
git add -p src/content.js src/popup.js tests/validate-extension.mjs
git diff --cached --check
git diff --cached
git commit -m "fix: synchronize session count across tabs"
```

### Task 3: Faster Sequential Click Path

**Files:**
- Modify: `tests/background-fixtures.mjs:33-121, 213`
- Modify: `tests/runner-fixtures.mjs`
- Modify: `src/background.js:669-746`
- Modify: `src/content.js:68-126, 1490-1526, 2020-2139, 2695-2705`
- Modify: `tests/validate-extension.mjs:91-218`

**Interfaces:**
- Produces: `prepareClickTarget(candidate, options) -> Promise<{point:{x:number,y:number}, scrolled:boolean}|null>`.
- Produces: `requestLikerPass(reason) -> void` with a single in-flight pass.
- Produces: `scheduleLikerWatchdog(delay = 1000) -> void`.
- Consumes: existing `processVisible`, `pointTargetsButton`, `confirmReaction`, and `scrollFeed`.

- [ ] **Step 1: Add failing CDP and click-preparation assertions**

Capture debugger commands in `tests/background-fixtures.mjs`, make the mock call its callback, send `pal-debugger-click`, and assert exactly one `mouseMoved`, one `mousePressed`, and one `mouseReleased` command.

Extend `tests/runner-fixtures.mjs` with a visible button whose `scrollIntoView` increments `scrollCalls`. Make `document.elementFromPoint` return that button, call `prepareClickTarget`, and assert `scrollCalls === 0` and `result.scrolled === false`.

- [ ] **Step 2: Run focused fixtures and verify failure**

Run: `node tests/background-fixtures.mjs && node tests/runner-fixtures.mjs`

Expected: FAIL because CDP currently emits seven moves and `prepareClickTarget` does not exist.

- [ ] **Step 3: Reduce CDP movement to one trusted move**

Change `debuggerClick` so the default is one `mouseMoved`, followed by press, an 8 ms humanized delay (4 ms without humanization), and release. Keep debugger attachment, point rounding, `pointerType: 'mouse'`, and DOM fallback unchanged.

```js
async function debuggerClick(tabId, point, options = {}) {
  await attachDebugger(tabId);
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  await sendDebuggee(tabId, 'Input.dispatchMouseEvent', {
    type: 'mouseMoved', x, y, button: 'none', pointerType: 'mouse'
  });
  await sendDebuggee(tabId, 'Input.dispatchMouseEvent', {
    type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse'
  });
  await new Promise(resolve => setTimeout(resolve, options.humanize ? 8 : 4));
  await sendDebuggee(tabId, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse'
  });
}
```

- [ ] **Step 4: Avoid unnecessary scrolling**

Implement:

```js
async function prepareClickTarget(candidate, options = {}) {
  if (!candidate.el || !candidate.el.isConnected) return null;
  let rect = candidate.el.getBoundingClientRect();
  let box = {x: rect.left, y: rect.top, width: rect.width, height: rect.height};
  let point = options.forceCenter ? centerPoint(box) : jitteredPoint(box);
  if (isVisible(candidate.el) && pointTargetsButton(candidate.el, point)) return {point, scrolled: false};
  candidate.el.scrollIntoView({block: 'center', inline: 'center', behavior: 'auto'});
  await nextFrame();
  if (!isVisible(candidate.el)) return null;
  rect = candidate.el.getBoundingClientRect();
  box = {x: rect.left, y: rect.top, width: rect.width, height: rect.height};
  point = options.forceCenter ? centerPoint(box) : jitteredPoint(box);
  return pointTargetsButton(candidate.el, point) ? {point, scrolled: true} : null;
}
```

Use it from `clickLike` before taking the snapshot and sending the debugger message.

- [ ] **Step 5: Replace the short timer chain with a coalesced scheduler**

Add runtime flags `runnerPassQueued`, `runnerPassInFlight`, and `runnerWatchdogTimer`. Implement one microtask scheduler: requests coalesce, only one `processVisible` call runs at a time, successful clicks request another pass, failures/no candidates schedule a 1-second watchdog, and `stopLiker` clears all scheduler state.

```js
function clearLikerWatchdog() {
  clearTimeout(runtime.runnerWatchdogTimer);
  runtime.runnerWatchdogTimer = 0;
}

function scheduleLikerWatchdog(delay = 1000) {
  if (!runtime.running || runtime.runnerWatchdogTimer) return;
  runtime.runnerWatchdogTimer = window.setTimeout(() => {
    runtime.runnerWatchdogTimer = 0;
    requestLikerPass('watchdog');
  }, Math.max(100, Number(delay) || 1000));
}

function requestLikerPass(reason = 'event') {
  if (!runtime.running) return;
  runtime.diagnostics.lastScheduleReason = reason;
  if (runtime.runnerPassQueued) return;
  runtime.runnerPassQueued = true;
  if (!runtime.runnerPassInFlight) queueMicrotask(runLikerPass);
}

async function runLikerPass() {
  if (!runtime.running) {
    runtime.runnerPassQueued = false;
    return;
  }
  if (runtime.runnerPassInFlight) return;
  runtime.runnerPassQueued = false;
  runtime.runnerPassInFlight = true;
  clearLikerWatchdog();
  try {
    closeBlockingOverlays();
    const result = await processVisible();
    if (!runtime.running) return;
    if (result.likedAny) requestLikerPass('liked');
    else if (result.holdViewport) scheduleLikerWatchdog(250);
    else {
      scrollFeed();
      scheduleLikerWatchdog(1000);
    }
  } finally {
    runtime.runnerPassInFlight = false;
    if (runtime.runnerPassQueued && runtime.running) queueMicrotask(runLikerPass);
  }
}
```

Add these runtime fields:

```js
runnerPassQueued: false,
runnerPassInFlight: false,
runnerWatchdogTimer: 0,
```

Use a feed-specific mutation predicate:

```js
function mutationTouchesFeed(records) {
  return records.some(record => {
    const target = record.target && record.target.nodeType === 1 ? record.target : record.target && record.target.parentElement;
    if (target && target.closest && target.closest('#recommendations-list')) return true;
    return Array.from(record.addedNodes || []).some(node => node && node.nodeType === 1 && (
      node.id === 'recommendations-list' || node.querySelector && node.querySelector('#recommendations-list')
    ));
  });
}
```

The document observer calls `schedulePhotoDecoration()` for every relevant DOM change and calls `requestLikerPass('feed-mutation')` only when `mutationTouchesFeed(records)` is true.

Restrict the document MutationObserver trigger to mutations inside `#recommendations-list` or added nodes containing that list; extension badge mutations must not schedule runner work. `startLiker` calls `requestLikerPass('start')` instead of `likerLoop()`.

- [ ] **Step 6: Add scheduler invariants**

Expose `prepareClickTarget` and a scheduler snapshot in the enabled test hook. Assert that three synchronous `requestLikerPass` calls produce one queued pass and that stopping clears the watchdog. Update static validation to reject `setTimeout(likerLoop, 35)` and require `requestLikerPass` plus `runnerPassInFlight`.

```js
Object.assign(globalThis.__PAL_TEST_HOOKS__.runner, {
  prepareClickTarget,
  requestLikerPass,
  scheduleLikerWatchdog,
  clearLikerWatchdog,
  setRunningForTest(value) {
    runtime.running = !!value;
  },
  setSchedulerForTest(value = {}) {
    runtime.runnerPassQueued = !!value.queued;
    runtime.runnerPassInFlight = !!value.inFlight;
  },
  schedulerSnapshot() {
    return {
      queued: runtime.runnerPassQueued,
      inFlight: runtime.runnerPassInFlight,
      watchdog: !!runtime.runnerWatchdogTimer
    };
  }
});
```

For the coalescing assertion, temporarily set `runnerPassInFlight` through a test-only setter before issuing three requests so the fixture inspects queued state without executing the real DOM processing pass. Clear the flag and watchdog after the assertion.

Run: `node tests/background-fixtures.mjs && node tests/runner-fixtures.mjs && npm run validate`

Expected: all checks pass with no duplicate-count fixture failures.

- [ ] **Step 7: Commit only new Task 3 hunks**

Run:

```bash
git add -p src/background.js src/content.js tests/background-fixtures.mjs tests/runner-fixtures.mjs tests/validate-extension.mjs
git diff --cached --check
git diff --cached
git commit -m "perf: accelerate sequential autoliking"
```

### Task 4: Full Validation And Manual Handoff

**Files:**
- Modify only if a failing validation exposes a scoped defect in Task 1-3 files.

**Interfaces:**
- Consumes all interfaces produced by Tasks 1-3.
- Produces a validation report; no new runtime interface.

- [ ] **Step 1: Run the full automated validation suite**

Run:

```bash
npm run validate
npm run audit:clean
npm --prefix backend/license-worker run check
git diff --check
```

Expected: every command exits 0 and prints the existing validation success messages.

- [ ] **Step 2: Inspect scoped diffs and repository state**

Run:

```bash
git status --short
git diff --stat
git log -4 --oneline
```

Expected: pre-existing user edits remain present unless they were deliberately included through selected implementation hunks; no media/site assets are staged accidentally.

- [ ] **Step 3: Execute manual browser checks**

Load `dist/chromium` as an unpacked extension and verify:

1. Invalid Telegram token reports `[getMe]` or validation without exposing token.
2. Invalid Chat ID reports `[getChat] Bad Request: chat not found` in full.
3. Valid credentials deliver the test message.
4. Likes running in tab A update the popup and page badge while tab B is active.
5. Foreground and background runs remain sequential and counts do not jump backward.
6. Browser service-worker console has no uncaught errors.

- [ ] **Step 4: Record any manual-only limitation in the final handoff**

If live Telegram credentials or a logged-in Pure session are unavailable, state exactly which manual checks were not run; do not claim them as passing.
