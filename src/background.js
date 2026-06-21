const DEBUGGER_VERSION = '1.3';
const RUNNER_LOCK_KEY = 'palRunnerLock';
const RUNNER_TIMERS_KEY = 'palRunnerTimers';
const TELEGRAM_STATE_KEY = 'palTelegramState';
const LICENSE_STATE_KEY = 'palLicenseState';
const INSTALLATION_ID_KEY = 'palInstallationId';
const RUNNER_STALE_MS = 5 * 60 * 1000;
const LICENSE_CACHE_MS = 24 * 60 * 60 * 1000;
const LICENSE_API_BASE = 'https://pureautolike-license.ziganshinoff.workers.dev';
const LICENSE_BETA_FALLBACK = false;
const TELEGRAM_SENT_MEMORY_LIMIT = 1000;
const TELEGRAM_CONFIG_BACKUP_KEY = 'palTelegramConfigBackup';
const TIMER_ALARMS = {
  autoStop: 'pal:auto-stop',
  closeTab: 'pal:close-tab'
};
const TELEGRAM_DEFAULTS = {
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramMatches: true,
  telegramMessages: true,
  telegramLikes: true,
  telegramCooldownSeconds: 30
};
const TELEGRAM_KIND_SETTINGS = {
  match: 'telegramMatches',
  message: 'telegramMessages',
  like: 'telegramLikes'
};
const attachedTabs = new Set();
const ext = globalThis.chrome || globalThis.browser;
const hasDebugger = !!(ext && ext.debugger && ext.debugger.attach && ext.debugger.sendCommand);
const hasAlarms = !!(ext && ext.alarms && ext.alarms.create && ext.alarms.clear);

function storageGet(defaults) {
  try {
    const result = ext.storage.local.get(defaults);
    if (result && typeof result.then === 'function') return result;
  } catch (_) {}
  return new Promise(resolve => ext.storage.local.get(defaults, resolve));
}

function storageSet(values) {
  try {
    const result = ext.storage.local.set(values);
    if (result && typeof result.then === 'function') return result;
  } catch (_) {}
  return new Promise(resolve => ext.storage.local.set(values, resolve));
}

function storageRemove(keys) {
  try {
    const result = ext.storage.local.remove(keys);
    if (result && typeof result.then === 'function') return result;
  } catch (_) {}
  return new Promise(resolve => ext.storage.local.remove(keys, resolve));
}

function tabsGet(tabId) {
  if (!ext.tabs || !ext.tabs.get || tabId == null) return Promise.resolve(null);
  try {
    const result = ext.tabs.get(tabId);
    if (result && typeof result.then === 'function') return result.catch(() => null);
  } catch (_) {}
  return new Promise(resolve => {
    ext.tabs.get(tabId, tab => {
      const error = ext.runtime.lastError;
      resolve(error ? null : tab);
    });
  });
}

function tabsUpdate(tabId, patch) {
  if (!ext.tabs || !ext.tabs.update || tabId == null) return Promise.resolve(null);
  try {
    const result = ext.tabs.update(tabId, patch);
    if (result && typeof result.then === 'function') return result.catch(() => null);
  } catch (_) {
    return Promise.resolve(null);
  }
  return new Promise(resolve => {
    ext.tabs.update(tabId, patch, tab => {
      const error = ext.runtime.lastError;
      resolve(error ? null : tab);
    });
  });
}

function tabsRemove(tabId) {
  if (!ext.tabs || !ext.tabs.remove || tabId == null) return Promise.resolve(false);
  try {
    const result = ext.tabs.remove(tabId);
    if (result && typeof result.then === 'function') return result.then(() => true).catch(() => false);
  } catch (_) {
    return Promise.resolve(false);
  }
  return new Promise(resolve => {
    ext.tabs.remove(tabId, () => {
      const error = ext.runtime.lastError;
      resolve(!error);
    });
  });
}

function tabsSendMessage(tabId, message) {
  if (!ext.tabs || !ext.tabs.sendMessage || tabId == null) return Promise.resolve({ok: false, error: 'tabs.sendMessage unavailable'});
  try {
    const result = ext.tabs.sendMessage(tabId, message);
    if (result && typeof result.then === 'function') return result.catch(error => ({ok: false, error: error.message || String(error)}));
  } catch (error) {
    return Promise.resolve({ok: false, error: error.message || String(error)});
  }
  return new Promise(resolve => {
    ext.tabs.sendMessage(tabId, message, response => {
      const error = ext.runtime.lastError;
      resolve(response || {ok: false, error: error && error.message ? error.message : 'no response'});
    });
  });
}

function alarmsCreate(name, when) {
  if (!hasAlarms) return Promise.resolve(false);
  try {
    const result = ext.alarms.create(name, {when});
    if (result && typeof result.then === 'function') return result.then(() => true).catch(() => false);
  } catch (_) {
    return Promise.resolve(false);
  }
  return Promise.resolve(true);
}

function alarmsClear(name) {
  if (!hasAlarms) return Promise.resolve(false);
  try {
    const result = ext.alarms.clear(name);
    if (result && typeof result.then === 'function') return result.catch(() => false);
  } catch (_) {
    return Promise.resolve(false);
  }
  return new Promise(resolve => ext.alarms.clear(name, ok => resolve(!!ok)));
}

async function setTabAutoDiscardable(tabId, value) {
  const tab = await tabsGet(tabId);
  if (!tab) return false;
  if (!Object.prototype.hasOwnProperty.call(tab, 'autoDiscardable')) return false;
  const updated = await tabsUpdate(tabId, {autoDiscardable: value});
  return !!updated;
}

async function runnerLock() {
  const data = await storageGet({[RUNNER_LOCK_KEY]: null});
  return data[RUNNER_LOCK_KEY] || null;
}

async function setRunnerLock(lock) {
  await storageSet({[RUNNER_LOCK_KEY]: lock || null});
}

async function isLiveLock(lock) {
  if (!lock || !lock.tabId) return false;
  const tab = await tabsGet(lock.tabId);
  if (!tab) return false;
  return Date.now() - Number(lock.heartbeatAt || lock.claimedAt || 0) <= RUNNER_STALE_MS;
}

async function currentRunnerLock() {
  const current = await runnerLock();
  if (await isLiveLock(current)) return current;
  if (current) await setRunnerLock(null);
  return null;
}

function lockForSender(sender) {
  const tab = sender.tab || {};
  return {
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url || '',
    title: tab.title || '',
    claimedAt: Date.now(),
    heartbeatAt: Date.now()
  };
}

async function claimRunner(sender) {
  const tabId = sender.tab && sender.tab.id;
  if (!tabId) return {ok: false, error: 'Pure tab is unavailable'};
  const current = await runnerLock();
  if (current && current.tabId === tabId) {
    const autoDiscardableDisabled = await setTabAutoDiscardable(tabId, false);
    const next = {...current, heartbeatAt: Date.now(), url: sender.tab.url || current.url || '', autoDiscardableDisabled};
    await setRunnerLock(next);
    return {ok: true, owner: next};
  }
  if (await isLiveLock(current)) {
    return {ok: false, error: 'Автолайкер уже работает в другой вкладке Pure', owner: current};
  }
  if (current) await setRunnerLock(null);
  const autoDiscardableDisabled = await setTabAutoDiscardable(tabId, false);
  const next = {...lockForSender(sender), autoDiscardableDisabled};
  await setRunnerLock(next);
  return {ok: true, owner: next};
}

async function heartbeatRunner(sender) {
  const tabId = sender.tab && sender.tab.id;
  const current = await runnerLock();
  if (!current || current.tabId !== tabId) {
    return {ok: false, error: 'Runner lock принадлежит другой вкладке', owner: current || null};
  }
  const next = {...current, heartbeatAt: Date.now(), url: sender.tab.url || current.url || ''};
  await setRunnerLock(next);
  return {ok: true, owner: next};
}

async function releaseRunner(sender) {
  const tabId = sender.tab && sender.tab.id;
  const current = await runnerLock();
  if (current && current.tabId === tabId) {
    await setRunnerLock(null);
    await setTabAutoDiscardable(tabId, true);
  }
  return {ok: true};
}

async function clearRunnerForTab(tabId) {
  const current = await runnerLock();
  if (current && current.tabId === tabId) await setRunnerLock(null);
  const timers = await runnerTimers();
  if (timers && timers.tabId === tabId) await clearRunnerTimers();
}

async function runnerTimers() {
  const data = await storageGet({[RUNNER_TIMERS_KEY]: null});
  return data[RUNNER_TIMERS_KEY] || null;
}

async function setRunnerTimers(timers) {
  if (!timers) {
    await storageRemove(RUNNER_TIMERS_KEY);
    return;
  }
  await storageSet({[RUNNER_TIMERS_KEY]: timers});
}

function normalizeTimerMinutes(value) {
  const minutes = Number.parseInt(String(value ?? 0), 10);
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.min(minutes, 1440);
}

function nowIso() {
  return new Date().toISOString();
}

function futureIso(ms) {
  return new Date(Date.now() + Math.max(0, Number(ms) || 0)).toISOString();
}

function randomId(prefix = 'pal') {
  const uuid = globalThis.crypto && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${uuid}`;
}

async function installationId() {
  const data = await storageGet({[INSTALLATION_ID_KEY]: ''});
  if (data[INSTALLATION_ID_KEY]) return String(data[INSTALLATION_ID_KEY]);
  const id = randomId('pal_install');
  await storageSet({[INSTALLATION_ID_KEY]: id});
  return id;
}

function manifestVersion() {
  try {
    return ext.runtime.getManifest().version || '';
  } catch (_) {
    return '';
  }
}

function normalizeLicenseState(value = {}) {
  const checkedAt = value.checkedAt || value.checked_at || nowIso();
  const nextCheckAt = value.nextCheckAt || value.next_check_at || futureIso(LICENSE_CACHE_MS);
  const access = value.access !== false;
  return {
    ok: value.ok !== false,
    access,
    mode: String(value.mode || (value.beta === false ? 'paid' : 'beta')),
    plan: String(value.plan || (value.beta === false ? 'free' : 'beta')),
    label: String(value.label || (access ? 'BETA' : 'LOCKED')).toUpperCase(),
    beta: value.beta !== false,
    source: String(value.source || 'local-beta'),
    reason: String(value.reason || ''),
    checkoutUrl: String(value.checkoutUrl || value.checkout_url || ''),
    checkedAt,
    nextCheckAt,
    extensionId: String(value.extensionId || value.extension_id || ext.runtime.id || ''),
    version: String(value.version || manifestVersion())
  };
}

function localBetaLicense(reason = 'beta_free') {
  return normalizeLicenseState({
    ok: true,
    access: true,
    mode: 'beta',
    plan: 'beta',
    label: 'BETA',
    beta: true,
    source: 'local-beta',
    reason,
    checkedAt: nowIso(),
    nextCheckAt: futureIso(LICENSE_CACHE_MS)
  });
}

function lockedLicense(reason = 'license_required', source = 'remote') {
  return normalizeLicenseState({
    ok: false,
    access: false,
    mode: 'error',
    plan: 'unknown',
    label: 'LOCKED',
    beta: false,
    source,
    reason,
    checkedAt: nowIso(),
    nextCheckAt: futureIso(15 * 60 * 1000)
  });
}

async function cachedLicenseState() {
  const data = await storageGet({[LICENSE_STATE_KEY]: null});
  return data[LICENSE_STATE_KEY] ? normalizeLicenseState(data[LICENSE_STATE_KEY]) : null;
}

async function setLicenseState(state) {
  const normalized = normalizeLicenseState(state);
  await storageSet({[LICENSE_STATE_KEY]: normalized});
  return normalized;
}

function licenseIsFresh(state) {
  if (!state || !state.nextCheckAt) return false;
  return Date.parse(state.nextCheckAt) > Date.now();
}

async function remoteLicenseCheck(installId) {
  const endpoint = LICENSE_API_BASE.replace(/\/+$/, '');
  if (!endpoint) return null;
  const response = await fetch(`${endpoint}/v1/license/check`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      installation_id: installId,
      extension_id: ext.runtime.id || '',
      version: manifestVersion(),
      channel: 'chrome-web-store'
    })
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {}
  if (!response.ok) {
    return normalizeLicenseState({
      ok: false,
      access: false,
      mode: 'error',
      plan: 'unknown',
      label: 'LOCKED',
      beta: false,
      source: 'remote',
      reason: (payload && payload.reason) || `license_http_${response.status}`,
      checkoutUrl: payload && payload.checkout_url,
      checkedAt: nowIso(),
      nextCheckAt: futureIso(15 * 60 * 1000)
    });
  }
  return normalizeLicenseState({...payload, source: 'remote'});
}

async function checkLicense(options = {}) {
  const cached = await cachedLicenseState();
  if (!options.force && licenseIsFresh(cached)) return cached;

  const installId = await installationId();
  try {
    const remote = await remoteLicenseCheck(installId);
    if (remote) return setLicenseState(remote);
  } catch (error) {
    if (LICENSE_BETA_FALLBACK) {
      return setLicenseState({...localBetaLicense('remote_unavailable_beta_fallback'), offline: true, error: error.message || String(error)});
    }
    return setLicenseState(lockedLicense(error.message || String(error), 'remote-error'));
  }

  return setLicenseState(lockedLicense('license_endpoint_missing', 'local-config'));
}

async function clearRunnerTimers(options = {}) {
  const current = await runnerTimers();
  const next = current && options.keepClose ? {...current, autoStopAt: ''} : null;
  await alarmsClear(TIMER_ALARMS.autoStop);
  if (!options.keepClose) await alarmsClear(TIMER_ALARMS.closeTab);
  await setRunnerTimers(next);
  return next;
}

async function scheduleRunnerTimers(sender, settings = {}) {
  if (!hasAlarms) return {ok: false, unsupported: true, error: 'alarms API unavailable'};
  const tab = sender.tab || {};
  if (!tab.id) return {ok: false, error: 'Pure tab is unavailable'};
  await clearRunnerTimers();
  const now = Date.now();
  const autoStopMinutes = normalizeTimerMinutes(settings.autoStopMinutes);
  const closeTabMinutes = normalizeTimerMinutes(settings.closeTabMinutes);
  const timers = {
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url || '',
    autoStopMinutes,
    closeTabMinutes,
    autoStopAt: autoStopMinutes ? new Date(now + autoStopMinutes * 60000).toISOString() : '',
    closeTabAt: closeTabMinutes ? new Date(now + closeTabMinutes * 60000).toISOString() : '',
    updatedAt: new Date(now).toISOString()
  };
  if (timers.autoStopAt) await alarmsCreate(TIMER_ALARMS.autoStop, Date.parse(timers.autoStopAt));
  if (timers.closeTabAt) await alarmsCreate(TIMER_ALARMS.closeTab, Date.parse(timers.closeTabAt));
  await setRunnerTimers(timers);
  return {ok: true, mode: 'background', timers};
}

async function releaseRunnerForTab(tabId) {
  const current = await runnerLock();
  if (current && current.tabId === tabId) {
    await setRunnerLock(null);
    await setTabAutoDiscardable(tabId, true);
  }
}

async function handleTimerAlarm(name) {
  const timers = await runnerTimers();
  if (!timers || !timers.tabId) return;
  if (name === TIMER_ALARMS.autoStop) {
    await setRunnerTimers({...timers, autoStopAt: '', updatedAt: new Date().toISOString()});
    await tabsSendMessage(timers.tabId, {type: 'pal-timer-fired', action: 'auto-stop'});
    await storageSet({enabled: false});
    await detachDebugger(timers.tabId);
    await releaseRunnerForTab(timers.tabId);
    return;
  }
  if (name === TIMER_ALARMS.closeTab) {
    await clearRunnerTimers();
    await storageSet({enabled: false});
    await tabsSendMessage(timers.tabId, {type: 'pal-timer-fired', action: 'close-tab'});
    await detachDebugger(timers.tabId);
    await releaseRunnerForTab(timers.tabId);
    await tabsRemove(timers.tabId);
  }
}

function normalizeTelegramState(value = {}) {
  const lastSent = value.lastSent && typeof value.lastSent === 'object' ? value.lastSent : {};
  const lastSentQueue = Array.isArray(value.lastSentQueue) ? value.lastSentQueue.filter(Boolean).slice(-TELEGRAM_SENT_MEMORY_LIMIT) : [];
  return {
    sent: Math.max(0, Number(value.sent) || 0),
    lastError: String(value.lastError || ''),
    lastEvent: value.lastEvent && typeof value.lastEvent === 'object' ? value.lastEvent : null,
    lastSent,
    lastSentQueue
  };
}

function normalizeTelegramSettings(value = {}) {
  const cooldown = Number.parseInt(String(value.telegramCooldownSeconds ?? TELEGRAM_DEFAULTS.telegramCooldownSeconds), 10);
  return {
    telegramEnabled: !!value.telegramEnabled,
    telegramBotToken: String(value.telegramBotToken || '').trim(),
    telegramChatId: String(value.telegramChatId || '').trim(),
    telegramMatches: value.telegramMatches !== false,
    telegramMessages: value.telegramMessages !== false,
    telegramLikes: value.telegramLikes !== false,
    telegramCooldownSeconds: Number.isFinite(cooldown) && cooldown > 0 ? cooldown : 0
  };
}

function hasTelegramConfig(settings = {}) {
  return !!(settings.telegramBotToken || settings.telegramChatId);
}

function restoreTelegramSettings(settings = {}, backup = {}) {
  const next = normalizeTelegramSettings(settings);
  const saved = normalizeTelegramSettings(backup);
  if (!hasTelegramConfig(next) && hasTelegramConfig(saved)) return saved;
  if (!next.telegramBotToken && saved.telegramBotToken) next.telegramBotToken = saved.telegramBotToken;
  if (!next.telegramChatId && saved.telegramChatId) next.telegramChatId = saved.telegramChatId;
  return next;
}

function telegramBackup(settings = {}) {
  return normalizeTelegramSettings(settings);
}

async function telegramSettings() {
  const data = await storageGet({...TELEGRAM_DEFAULTS, [TELEGRAM_CONFIG_BACKUP_KEY]: null});
  const backup = data[TELEGRAM_CONFIG_BACKUP_KEY] && typeof data[TELEGRAM_CONFIG_BACKUP_KEY] === 'object'
    ? data[TELEGRAM_CONFIG_BACKUP_KEY]
    : {};
  const settings = restoreTelegramSettings(data, backup);
  const patch = {};
  for (const [key, value] of Object.entries(settings)) {
    if (data[key] !== value) patch[key] = value;
  }
  if (hasTelegramConfig(settings)) patch[TELEGRAM_CONFIG_BACKUP_KEY] = telegramBackup(settings);
  if (Object.keys(patch).length) await storageSet(patch);
  return settings;
}

async function migrateTelegramSettings() {
  try {
    await telegramSettings();
  } catch (_) {}
}

async function telegramState() {
  const data = await storageGet({[TELEGRAM_STATE_KEY]: null});
  return normalizeTelegramState(data[TELEGRAM_STATE_KEY] || {});
}

async function setTelegramState(state) {
  await storageSet({[TELEGRAM_STATE_KEY]: normalizeTelegramState(state)});
}

function truncateLine(text, limit = 180) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function telegramText(signal) {
  const lines = [signal.title || 'PureAutoLike', signal.body || 'Новое событие в Pure'];
  if (signal.kind === 'message' && signal.text) lines.push(`Текст: ${truncateLine(signal.text)}`);
  if (signal.kind === 'like' && signal.label) lines.push(`Профиль: ${truncateLine(signal.label, 80)}`);
  return lines.join('\n');
}

function canNotifyTelegram(settings, signal) {
  if (!settings.telegramEnabled) return false;
  if (!settings.telegramBotToken || !settings.telegramChatId) return false;
  const setting = TELEGRAM_KIND_SETTINGS[signal.kind];
  return !setting || settings[setting] !== false;
}

function rememberTelegramSent(state, key, value) {
  if (!state.lastSent[key]) state.lastSentQueue.push(key);
  state.lastSent[key] = value;
  while (state.lastSentQueue.length > TELEGRAM_SENT_MEMORY_LIMIT) {
    const oldKey = state.lastSentQueue.shift();
    delete state.lastSent[oldKey];
  }
}

async function sendTelegram(message) {
  const botToken = String(message.botToken || '').trim();
  const chatId = String(message.chatId || '').trim();
  const text = String(message.text || '').trim();
  if (!botToken || !chatId) return {ok: false, error: 'Telegram не настроен'};
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) return {ok: false, error: 'Некорректный Telegram token'};
  if (!text) return {ok: false, error: 'Пустое Telegram-сообщение'};

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true
      })
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch (_) {}
    if (!response.ok || (payload && payload.ok === false)) {
      return {ok: false, error: (payload && payload.description) || `Telegram HTTP ${response.status}`};
    }
    return {ok: true};
  } catch (error) {
    return {ok: false, error: error.message || String(error)};
  }
}

async function handleTelegramEvent(rawSignal = {}) {
  const signal = {
    kind: String(rawSignal.kind || 'event'),
    dedupeKey: String(rawSignal.dedupeKey || rawSignal.key || ''),
    title: String(rawSignal.title || 'PureAutoLike'),
    body: String(rawSignal.body || 'Новое событие в Pure'),
    source: String(rawSignal.source || ''),
    text: String(rawSignal.text || ''),
    label: String(rawSignal.label || '')
  };
  const state = await telegramState();
  state.lastEvent = {kind: signal.kind, source: signal.source, ts: Date.now()};
  state.lastError = '';

  const settings = await telegramSettings();
  if (!canNotifyTelegram(settings, signal)) {
    await setTelegramState(state);
    return {ok: true, skipped: true, configured: false, sent: state.sent, lastEvent: state.lastEvent};
  }

  const sentKey = `${signal.kind}:${signal.dedupeKey}`;
  if (signal.dedupeKey && state.lastSent[sentKey]) {
    await setTelegramState(state);
    return {ok: true, skipped: true, duplicate: true, configured: true, sent: state.sent, lastEvent: state.lastEvent};
  }

  const cooldownMs = Math.max(0, Number(settings.telegramCooldownSeconds) || 0) * 1000;
  const kindKey = `kind:${signal.kind}`;
  const now = Date.now();
  if (cooldownMs > 0 && now - (Number(state.lastSent[kindKey]) || 0) < cooldownMs) {
    await setTelegramState(state);
    return {ok: true, skipped: true, cooldown: true, configured: true, sent: state.sent, lastEvent: state.lastEvent};
  }

  const response = await sendTelegram({
    botToken: settings.telegramBotToken,
    chatId: settings.telegramChatId,
    text: telegramText(signal)
  });
  if (response && response.ok) {
    state.sent += 1;
    if (signal.dedupeKey) rememberTelegramSent(state, sentKey, now);
    rememberTelegramSent(state, kindKey, now);
    await setTelegramState(state);
    return {ok: true, configured: true, sent: state.sent, lastEvent: state.lastEvent};
  }
  state.lastError = response && response.error ? response.error : 'Telegram send failed';
  await setTelegramState(state);
  return {ok: false, configured: true, sent: state.sent, lastError: state.lastError, lastEvent: state.lastEvent};
}

function sendDebuggee(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    ext.debugger.sendCommand({tabId}, method, params, result => {
      const error = ext.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
}

function attachDebugger(tabId) {
  if (attachedTabs.has(tabId)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (!hasDebugger) {
      reject(new Error('debugger API is unavailable in this browser'));
      return;
    }
    ext.debugger.attach({tabId}, DEBUGGER_VERSION, () => {
      const error = ext.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      attachedTabs.add(tabId);
      resolve();
    });
  });
}

function detachDebugger(tabId) {
  if (!attachedTabs.has(tabId)) return Promise.resolve();
  return new Promise(resolve => {
    ext.debugger.detach({tabId}, () => {
      attachedTabs.delete(tabId);
      resolve();
    });
  });
}

async function debuggerClick(tabId, point, options = {}) {
  await attachDebugger(tabId);
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  const steps = Math.max(1, Math.min(18, options.steps || 7));
  const start = options.from || {x: x - 28, y: y - 18};
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const mx = Math.round(start.x + (x - start.x) * t);
    const my = Math.round(start.y + (y - start.y) * t);
    await sendDebuggee(tabId, 'Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: mx,
      y: my,
      button: 'none',
      pointerType: 'mouse'
    });
    if (options.humanize) await new Promise(r => setTimeout(r, 8 + Math.round(Math.random() * 12)));
  }
  await sendDebuggee(tabId, 'Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    buttons: 1,
    clickCount: 1,
    pointerType: 'mouse'
  });
  await new Promise(r => setTimeout(r, options.humanize ? 35 : 8));
  await sendDebuggee(tabId, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    buttons: 0,
    clickCount: 1,
    pointerType: 'mouse'
  });
}

if (hasDebugger) {
  ext.debugger.onDetach.addListener(debuggee => {
    if (debuggee.tabId != null) attachedTabs.delete(debuggee.tabId);
  });
}

if (ext.tabs && ext.tabs.onRemoved) {
  ext.tabs.onRemoved.addListener(tabId => {
    attachedTabs.delete(tabId);
    clearRunnerForTab(tabId);
  });
}

if (hasAlarms && ext.alarms.onAlarm) {
  ext.alarms.onAlarm.addListener(alarm => {
    if (!alarm || !alarm.name) return;
    handleTimerAlarm(alarm.name);
  });
}

if (ext.runtime && ext.runtime.onInstalled) {
  ext.runtime.onInstalled.addListener(() => migrateTelegramSettings());
}

void migrateTelegramSettings();

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'pal-capabilities') {
    sendResponse({
      ok: true,
      debugger: hasDebugger,
      clickMode: hasDebugger ? 'cdp' : 'dom'
    });
    return false;
  }

  if (message && (message.type === 'pal-license-check' || message.type === 'pal-license-status')) {
    checkLicense({force: message.type === 'pal-license-check' && !!message.force})
      .then(sendResponse)
      .catch(error => sendResponse({
        ok: false,
        access: false,
        mode: 'error',
        plan: 'unknown',
        label: 'LOCKED',
        reason: error.message || String(error)
      }));
    return true;
  }

  if (message && (message.type === 'pal-telegram-send' || message.type === 'pal-telegram-test')) {
    sendTelegram(message).then(sendResponse);
    return true;
  }

  if (message && message.type === 'pal-telegram-event') {
    handleTelegramEvent(message.signal || {})
      .then(sendResponse)
      .catch(error => sendResponse({ok: false, error: error.message || String(error)}));
    return true;
  }

  if (message && message.type === 'pal-telegram-status') {
    Promise.all([telegramState(), telegramSettings()])
      .then(([state, settings]) => sendResponse({
        ok: true,
        configured: !!(settings.telegramEnabled && settings.telegramBotToken && settings.telegramChatId),
        sent: state.sent,
        lastError: state.lastError,
        lastEvent: state.lastEvent
      }))
      .catch(error => sendResponse({ok: false, error: error.message || String(error)}));
    return true;
  }

  if (message && message.type === 'pal-runner-claim') {
    checkLicense()
      .then(license => {
        if (!license.access) {
          return {
            ok: false,
            error: license.reason || 'Subscription required',
            license
          };
        }
        return claimRunner(sender).then(result => ({...result, license}));
      })
      .then(sendResponse)
      .catch(error => sendResponse({ok: false, error: error.message || String(error)}));
    return true;
  }

  if (message && message.type === 'pal-runner-heartbeat') {
    heartbeatRunner(sender).then(sendResponse);
    return true;
  }

  if (message && message.type === 'pal-runner-release') {
    releaseRunner(sender).then(sendResponse);
    return true;
  }

  if (message && message.type === 'pal-runner-status') {
    currentRunnerLock().then(lock => sendResponse({ok: true, owner: lock}));
    return true;
  }

  if (message && message.type === 'pal-runner-timers-set') {
    scheduleRunnerTimers(sender, message.settings || {})
      .then(sendResponse)
      .catch(error => sendResponse({ok: false, error: error.message || String(error)}));
    return true;
  }

  if (message && message.type === 'pal-runner-timers-clear') {
    clearRunnerTimers({keepClose: !!message.keepClose})
      .then(timers => sendResponse({ok: true, timers, mode: hasAlarms ? 'background' : 'content'}))
      .catch(error => sendResponse({ok: false, error: error.message || String(error)}));
    return true;
  }

  if (message && message.type === 'pal-runner-timers-status') {
    runnerTimers()
      .then(timers => sendResponse({ok: true, timers, mode: hasAlarms ? 'background' : 'content'}))
      .catch(error => sendResponse({ok: false, error: error.message || String(error)}));
    return true;
  }

  const tabId = sender.tab && sender.tab.id;
  if (!tabId) return false;

  if (message && message.type === 'pal-debugger-click') {
    if (!hasDebugger) {
      sendResponse({ok: false, unsupported: true, error: 'debugger API is unavailable in this browser'});
      return false;
    }
    debuggerClick(tabId, message.point, message.options || {})
      .then(() => sendResponse({ok: true}))
      .catch(error => sendResponse({ok: false, error: error.message}));
    return true;
  }

  if (message && message.type === 'pal-debugger-detach') {
    detachDebugger(tabId).then(() => sendResponse({ok: true}));
    return true;
  }

  if (message && message.type === 'pal-close-tab') {
    releaseRunner(sender)
      .then(() => detachDebugger(tabId))
      .then(() => tabsRemove(tabId))
      .then(ok => sendResponse({ok}))
      .catch(error => sendResponse({ok: false, error: error.message || String(error)}));
    return true;
  }

  return false;
});
