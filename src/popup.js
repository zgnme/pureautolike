const DEFAULTS = {
  enabled: false,
  useDebugger: true,
  humanizeMouse: true,
  photoOpener: true,
  sessionLimit: 0,
  clickJitter: 0.25,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramMatches: true,
  telegramMessages: true,
  telegramLikes: true,
  telegramCooldownSeconds: 30,
  autoStopMinutes: 0,
  closeTabMinutes: 0,
  profileCaptureEnabled: false,
  uiLanguage: 'ru'
};

const PROFILE_CAPTURE_KEY = 'palProfileCaptures';
const PROFILE_CAPTURE_INDEX_KEY = 'palProfileCaptureIndex';
const PROFILE_CAPTURE_CHUNK_PREFIX = 'palProfileCaptureChunk:';
const TELEGRAM_CONFIG_BACKUP_KEY = 'palTelegramConfigBackup';
const ext = globalThis.browser || globalThis.chrome;
const NATIVE_SETTINGS = {
  humanizeMouse: true,
  photoOpener: true,
  sessionLimit: 0
};
const CONTENT_SECRET_KEYS = ['telegramBotToken', 'telegramChatId'];
const TELEGRAM_CONFIG_KEYS = [
  'telegramEnabled',
  'telegramBotToken',
  'telegramChatId',
  'telegramMatches',
  'telegramMessages',
  'telegramLikes',
  'telegramCooldownSeconds'
];
let capabilities = {debugger: false, clickMode: 'dom'};
let clickJitterTimer = 0;
let timerSettingsTimer = 0;
let refreshTimer = 0;
let refreshInFlight = false;
let currentLocale = 'ru';
let currentLicense = {access: true, mode: 'beta', label: 'BETA'};

const controls = {
  toggle: document.getElementById('toggle'),
  toggleLabel: document.getElementById('toggleLabel'),
  toggleHint: document.getElementById('toggleHint'),
  licenseBadge: document.getElementById('licenseBadge'),
  languageToggle: document.getElementById('languageToggle'),
  feedbackLink: document.getElementById('feedbackLink'),
  statusText: document.getElementById('statusText'),
  statusPill: document.getElementById('statusPill'),
  likes: document.getElementById('likes'),
  autoStopMinutes: document.getElementById('autoStopMinutes'),
  closeTabMinutes: document.getElementById('closeTabMinutes'),
  autoStopTimerValue: document.getElementById('autoStopTimerValue'),
  closeTabTimerValue: document.getElementById('closeTabTimerValue'),
  timerStatus: document.getElementById('timerStatus'),
  clickJitter: document.getElementById('clickJitter'),
  clickJitterValue: document.getElementById('clickJitterValue'),
  telegramEnabled: document.getElementById('telegramEnabled'),
  telegramBotToken: document.getElementById('telegramBotToken'),
  telegramChatId: document.getElementById('telegramChatId'),
  telegramMatches: document.getElementById('telegramMatches'),
  telegramMessages: document.getElementById('telegramMessages'),
  telegramLikes: document.getElementById('telegramLikes'),
  telegramCooldownSeconds: document.getElementById('telegramCooldownSeconds'),
  telegramTest: document.getElementById('telegramTest'),
  telegramStatus: document.getElementById('telegramStatus'),
  telegramPanel: document.getElementById('telegramPanel'),
  profileCaptureEnabled: document.getElementById('profileCaptureEnabled'),
  profileCaptureCount: document.getElementById('profileCaptureCount'),
  profileCaptureExport: document.getElementById('profileCaptureExport'),
  profileCaptureClear: document.getElementById('profileCaptureClear'),
  profileCaptureStatus: document.getElementById('profileCaptureStatus'),
  profileCapturePanel: document.getElementById('profileCapturePanel'),
  lastError: document.getElementById('lastError')
};

const I18N = {
  ru: {
    languageToggle: 'RU / EN',
    feedback: 'Feedback',
    openPure: 'Открой вкладку Pure',
    loading: 'загрузка',
    ready: 'готов',
    active: 'активен',
    runningThisTab: 'работает здесь',
    runningOtherTab: 'работает в другой вкладке',
    noPureTab: 'нет вкладки Pure',
    start: 'Запустить',
    stop: 'Остановить',
    autoLike: 'Auto like',
    autoLikeActive: 'Auto like активен',
    timers: 'Таймеры',
    autoStop: 'Выключить автолайкер',
    autoStopHint: 'минут до остановки',
    closePure: 'Закрыть вкладку Pure',
    closePureHint: 'минут до закрытия',
    off: 'выкл',
    minutes: 'мин',
    lessMinute: 'меньше минуты',
    hour: 'ч',
    inWord: 'через',
    afterStart: 'После запуска',
    autoliker: 'автолайкер',
    tab: 'вкладка',
    timersOff: 'Таймеры выключены',
    timersInactive: 'Таймеры для этой сессии не активны',
    profileCapture: 'Сбор описаний',
    profileCaptureHint: 'Markdown для AI',
    collected: 'Собр.',
    exportMd: 'MD',
    clear: 'Очистить',
    captureOff: 'Сбор выключен',
    captureOffSaved: 'Сбор выключен, данные сохранены',
    captureOn: 'Сбор включен',
    noProfiles: 'Пока нет собранных описаний',
    exported: 'Экспортировано',
    cleared: 'Очищено',
    telegramHint: 'матчи, сообщения, лайки',
    botTokenPlaceholder: 'token от BotFather',
    chatIdPlaceholder: 'личный chat id или канал',
    cooldown: 'Пауза, сек',
    matches: 'Матчи',
    messages: 'Сообщения',
    likesEvent: 'Лайки',
    testTelegram: 'Проверить Telegram',
    telegramOff: 'Telegram выключен',
    addToken: 'Добавь token и chat id',
    telegramReady: 'Telegram готов',
    testSent: 'Тест отправлен',
    testFailed: 'Не удалось отправить тест',
    eventCaught: 'Поймано событие',
    sent: 'отправлено',
    betaTitle: 'Бесплатно во время beta',
    paidTitle: 'Подписка активна',
    lockedTitle: 'Нужна подписка',
    subscriptionRequired: 'Нужна подписка',
    match: 'матч',
    message: 'сообщение',
    like: 'лайк',
    event: 'событие'
  },
  en: {
    languageToggle: 'EN / RU',
    feedback: 'Feedback',
    openPure: 'Open Pure tab',
    loading: 'loading',
    ready: 'ready',
    active: 'active',
    runningThisTab: 'running here',
    runningOtherTab: 'running in another tab',
    noPureTab: 'no Pure tab',
    start: 'Start',
    stop: 'Stop',
    autoLike: 'Auto like',
    autoLikeActive: 'Auto like active',
    timers: 'Timers',
    autoStop: 'Stop autoliker',
    autoStopHint: 'minutes to stop',
    closePure: 'Close Pure tab',
    closePureHint: 'minutes to close',
    off: 'off',
    minutes: 'min',
    lessMinute: 'less than a minute',
    hour: 'h',
    inWord: 'in',
    afterStart: 'After start',
    autoliker: 'autoliker',
    tab: 'tab',
    timersOff: 'Timers off',
    timersInactive: 'Timers are not active for this session',
    profileCapture: 'Profile capture',
    profileCaptureHint: 'Markdown for AI analysis',
    collected: 'Count',
    exportMd: 'MD',
    clear: 'Clear',
    captureOff: 'Capture off',
    captureOffSaved: 'Capture off, data saved',
    captureOn: 'Capture on',
    noProfiles: 'No captured profiles yet',
    exported: 'Exported',
    cleared: 'Cleared',
    telegramHint: 'matches, messages, likes',
    botTokenPlaceholder: 'BotFather token',
    chatIdPlaceholder: 'personal chat id or channel',
    cooldown: 'Delay, sec',
    matches: 'Matches',
    messages: 'Messages',
    likesEvent: 'Likes',
    testTelegram: 'Test Telegram',
    telegramOff: 'Telegram off',
    addToken: 'Add token and chat id',
    telegramReady: 'Telegram ready',
    testSent: 'Test sent',
    testFailed: 'Failed to send test',
    eventCaught: 'Event caught',
    sent: 'sent',
    betaTitle: 'Free during beta',
    paidTitle: 'Subscription active',
    lockedTitle: 'Subscription required',
    subscriptionRequired: 'Subscription required',
    match: 'match',
    message: 'message',
    like: 'like',
    event: 'event'
  }
};

function normalizeLanguage(value) {
  return value === 'en' ? 'en' : 'ru';
}

function t(key) {
  return (I18N[currentLocale] && I18N[currentLocale][key]) || I18N.ru[key] || key;
}

function applyLanguage(language) {
  currentLocale = normalizeLanguage(language);
  document.documentElement.lang = currentLocale;
  if (controls.languageToggle) controls.languageToggle.textContent = t('languageToggle');
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
  }
}

function activePureTab() {
  return tabsQuery({active: true, currentWindow: true}).then(tabs => {
    const tab = tabs[0];
    if (!tab || !/^https:\/\/pure\.app\//.test(tab.url || '')) {
      throw new Error(t('openPure'));
    }
    return tab;
  });
}

async function sendToPure(message) {
  const tab = await activePureTab();
  return tabsSendMessage(tab.id, message);
}

async function loadSettings() {
  await loadCapabilities();
  const data = await storedSettings();
  await storageSet({...data, ...telegramBackupPatch(data)});
  applyLanguage(data.uiLanguage);
  for (const key of ['telegramEnabled', 'telegramMatches', 'telegramMessages', 'telegramLikes']) {
    controls[key].checked = !!data[key];
  }
  controls.profileCaptureEnabled.checked = !!data.profileCaptureEnabled;
  controls.clickJitter.value = String(data.clickJitter ?? DEFAULTS.clickJitter);
  controls.autoStopMinutes.value = String(data.autoStopMinutes || 0);
  controls.closeTabMinutes.value = String(data.closeTabMinutes || 0);
  controls.telegramBotToken.value = data.telegramBotToken || '';
  controls.telegramChatId.value = data.telegramChatId || '';
  controls.telegramCooldownSeconds.value = String(data.telegramCooldownSeconds ?? DEFAULTS.telegramCooldownSeconds);
  renderJitter(data.clickJitter ?? DEFAULTS.clickJitter);
  renderTimerSettings(data);
  renderStatus(data);
  renderTelegramStatus(data);
  await refreshLicense(false);
  await renderProfileCaptureStatus(data);
}

function renderStatus(data) {
  if (controls.toggleLabel) {
    controls.toggleLabel.textContent = data.enabled ? t('stop') : t('start');
  } else {
    controls.toggle.textContent = data.enabled ? t('stop') : t('start');
  }
  if (controls.toggleHint) {
    controls.toggleHint.textContent = data.enabled ? t('autoLikeActive') : t('autoLike');
  }
  controls.toggle.classList.toggle('running', !!data.enabled);
  controls.statusPill.textContent = data.enabled ? 'ON' : 'OFF';
  controls.statusPill.classList.toggle('on', !!data.enabled);
  controls.statusText.textContent = data.enabled ? t('active') : t('ready');
}

function renderLicense(license = {}) {
  currentLicense = {
    access: license.access !== false,
    mode: license.mode || 'beta',
    label: String(license.label || (license.access === false ? 'LOCKED' : 'BETA')).toUpperCase(),
    reason: license.reason || '',
    checkoutUrl: license.checkoutUrl || license.checkout_url || ''
  };
  if (!controls.licenseBadge) return currentLicense;
  controls.licenseBadge.textContent = currentLicense.label;
  controls.licenseBadge.classList.toggle('locked', !currentLicense.access);
  controls.licenseBadge.classList.toggle('paid', currentLicense.access && currentLicense.mode === 'paid');
  controls.licenseBadge.classList.toggle('beta', currentLicense.access && currentLicense.mode !== 'paid');
  controls.licenseBadge.title = currentLicense.access
    ? (currentLicense.mode === 'paid' ? t('paidTitle') : t('betaTitle'))
    : `${t('lockedTitle')}${currentLicense.reason ? `: ${currentLicense.reason}` : ''}`;
  controls.toggle.disabled = !currentLicense.access;
  return currentLicense;
}

async function refreshLicense(force = false) {
  const response = await runtimeSendMessage({type: 'pal-license-check', force});
  return renderLicense(response || {});
}

function renderJitter(value) {
  controls.clickJitterValue.textContent = `${Math.round((Number(value) || 0) * 100)}%`;
}

function timerValueText(minutes) {
  const value = normalizeTimerMinutes(minutes);
  return value > 0 ? `${value} ${t('minutes')}` : t('off');
}

function durationText(ms) {
  const totalMinutes = Math.max(0, Math.ceil((Number(ms) || 0) / 60000));
  if (totalMinutes <= 0) return t('lessMinute');
  if (totalMinutes < 60) return `${totalMinutes} ${t('minutes')}`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} ${t('hour')} ${minutes} ${t('minutes')}` : `${hours} ${t('hour')}`;
}

function renderTimerSettings(data) {
  controls.autoStopTimerValue.textContent = timerValueText(data.autoStopMinutes);
  controls.closeTabTimerValue.textContent = timerValueText(data.closeTabMinutes);
  const parts = [];
  if (normalizeTimerMinutes(data.autoStopMinutes)) parts.push(`${t('autoliker')}: ${timerValueText(data.autoStopMinutes)}`);
  if (normalizeTimerMinutes(data.closeTabMinutes)) parts.push(`${t('tab')}: ${timerValueText(data.closeTabMinutes)}`);
  controls.timerStatus.textContent = parts.length ? `${t('afterStart')}: ${parts.join(', ')}` : t('timersOff');
}

function renderRuntime(status) {
  const sessionStats = status.sessionStats || {};
  controls.likes.textContent = String(status.likes ?? sessionStats.likes ?? 0);
  if (status.running) {
    controls.statusText.textContent = t('runningThisTab');
  } else if (status.runnerOwner && status.runnerOwner.tabId) {
    controls.statusText.textContent = t('runningOtherTab');
  }
  controls.lastError.textContent = status.lastError || '';
  controls.lastError.classList.toggle('show', !!status.lastError);
  if (status.telegramLastError) {
    setTelegramStatus(status.telegramLastError, 'error');
  } else if (status.telegramLastEvent) {
    const kind = {match: t('match'), message: t('message'), like: t('like')}[status.telegramLastEvent.kind] || t('event');
    setTelegramStatus(`${t('eventCaught')}: ${kind}; ${t('sent')} ${status.telegramSent || 0}`, status.telegramConfigured ? 'ok' : '');
  }
  if (Number.isFinite(Number(status.profileCaptureCount))) {
    controls.profileCaptureCount.textContent = String(status.profileCaptureCount || 0);
  }
  renderTimerRuntime(status);
}

function renderTelegramRuntime(status) {
  if (!status || status.ok === false) return;
  if (status.lastError) {
    setTelegramStatus(status.lastError, 'error');
    return;
  }
  if (status.lastEvent) {
    const kind = {match: t('match'), message: t('message'), like: t('like')}[status.lastEvent.kind] || t('event');
    setTelegramStatus(`${t('eventCaught')}: ${kind}; ${t('sent')} ${status.sent || 0}`, status.configured ? 'ok' : '');
  }
}

function renderTimerRuntime(status) {
  const timers = status.timers || {};
  const now = timers.now ? Date.parse(timers.now) : Date.now();
  const parts = [];
  if (timers.autoStopAt) parts.push(`${t('autoliker')} ${t('inWord')} ${durationText(Date.parse(timers.autoStopAt) - now)}`);
  if (timers.closeTabAt) parts.push(`${t('tab')} ${t('inWord')} ${durationText(Date.parse(timers.closeTabAt) - now)}`);
  if (parts.length) {
    controls.timerStatus.textContent = parts.join(', ');
    return;
  }
  renderTimerSettings({
    ...DEFAULTS,
    autoStopMinutes: timers.autoStopMinutes,
    closeTabMinutes: timers.closeTabMinutes
  });
  if (status.running) {
    controls.timerStatus.textContent = t('timersInactive');
  }
}

async function savePatch(patch) {
  const current = await storedSettings();
  const next = normalizeSettings({...current, ...patch});
  const touchesTelegram = TELEGRAM_CONFIG_KEYS.some(key => Object.prototype.hasOwnProperty.call(patch, key));
  await storageSet({...next, ...telegramBackupPatch(next, touchesTelegram)});
  renderStatus(next);
  try {
    await sendToPure({type: 'pal-settings-updated', settings: contentSettings(next)});
  } catch (_) {}
}

async function saveEnabled(enabled) {
  const current = await storedSettings();
  const next = normalizeSettings({...current, enabled});
  let startResponse = null;
  if (enabled) {
    const license = await refreshLicense(false);
    if (!license.access) {
      controls.lastError.textContent = license.reason || t('subscriptionRequired');
      controls.lastError.classList.add('show');
      return;
    }
    try {
      const tab = await activePureTab();
      startResponse = await tabsSendMessage(tab.id, {type: 'pal-settings-updated', settings: contentSettings(next), startRunner: true, resetStats: true});
    } catch (error) {
      startResponse = {ok: false, error: error.message || String(error)};
    }
    if (startResponse && startResponse.ok === false && /Открой вкладку Pure|Open Pure tab/.test(startResponse.error || '')) {
      controls.lastError.textContent = startResponse.error;
      controls.lastError.classList.add('show');
      return;
    }
  }
  await storageSet({...next, ...telegramBackupPatch(next)});
  renderStatus(next);
  if (!enabled) {
    try {
      await sendToPure({type: 'pal-settings-updated', settings: contentSettings(next)});
    } catch (_) {}
  }
  if (startResponse && startResponse.ok === false) {
    renderLicense(startResponse.license || currentLicense);
    controls.lastError.textContent = startResponse.error || t('subscriptionRequired');
    controls.lastError.classList.add('show');
  }
}

function normalizeSettings(settings) {
  return {
    ...DEFAULTS,
    ...settings,
    uiLanguage: normalizeLanguage(settings.uiLanguage),
    autoStopMinutes: normalizeTimerMinutes(settings.autoStopMinutes),
    closeTabMinutes: normalizeTimerMinutes(settings.closeTabMinutes),
    ...NATIVE_SETTINGS,
    useDebugger: capabilities && capabilities.debugger !== false
  };
}

async function storedSettings() {
  const raw = await storageGet({...DEFAULTS, [TELEGRAM_CONFIG_BACKUP_KEY]: null});
  return normalizeSettings(restoreTelegramConfig(raw));
}

function normalizeTelegramConfig(settings = {}) {
  const normalized = normalizeSettings({...DEFAULTS, ...settings});
  return {
    telegramEnabled: !!normalized.telegramEnabled,
    telegramBotToken: String(normalized.telegramBotToken || '').trim(),
    telegramChatId: String(normalized.telegramChatId || '').trim(),
    telegramMatches: normalized.telegramMatches !== false,
    telegramMessages: normalized.telegramMessages !== false,
    telegramLikes: normalized.telegramLikes !== false,
    telegramCooldownSeconds: Math.max(0, Number.parseInt(String(normalized.telegramCooldownSeconds ?? DEFAULTS.telegramCooldownSeconds), 10) || 0)
  };
}

function hasTelegramConfig(settings = {}) {
  return !!(settings.telegramBotToken || settings.telegramChatId);
}

function restoreTelegramConfig(raw = {}) {
  const backup = raw[TELEGRAM_CONFIG_BACKUP_KEY] && typeof raw[TELEGRAM_CONFIG_BACKUP_KEY] === 'object'
    ? raw[TELEGRAM_CONFIG_BACKUP_KEY]
    : {};
  const next = {...raw};
  const saved = normalizeTelegramConfig(backup);
  if (!hasTelegramConfig(next) && hasTelegramConfig(saved)) {
    Object.assign(next, saved);
    return next;
  }
  if (!next.telegramBotToken && saved.telegramBotToken) next.telegramBotToken = saved.telegramBotToken;
  if (!next.telegramChatId && saved.telegramChatId) next.telegramChatId = saved.telegramChatId;
  return next;
}

function telegramBackupPatch(settings = {}, force = false) {
  const backup = normalizeTelegramConfig(settings);
  if (!force && !hasTelegramConfig(backup)) return {};
  return {[TELEGRAM_CONFIG_BACKUP_KEY]: backup};
}

function contentSettings(settings) {
  const sanitized = {...settings};
  for (const key of CONTENT_SECRET_KEYS) delete sanitized[key];
  delete sanitized.uiLanguage;
  return sanitized;
}

function normalizeTimerMinutes(value) {
  const minutes = Number.parseInt(String(value ?? 0), 10);
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.min(minutes, 1440);
}

function normalizeProfiles(value) {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
}

function estimateJsonBytes(value) {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch (_) {
    return JSON.stringify(value || '').length;
  }
}

async function storedProfiles() {
  const data = await storageGet({[PROFILE_CAPTURE_INDEX_KEY]: null, [PROFILE_CAPTURE_KEY]: []});
  const index = data[PROFILE_CAPTURE_INDEX_KEY];
  if (index && Array.isArray(index.chunks) && index.chunks.length) {
    const defaults = {};
    for (const key of index.chunks) defaults[key] = [];
    const chunkData = await storageGet(defaults);
    const profiles = [];
    for (const key of index.chunks) {
      if (Array.isArray(chunkData[key])) profiles.push(...chunkData[key]);
    }
    return normalizeProfiles(profiles);
  }
  return normalizeProfiles(data[PROFILE_CAPTURE_KEY]);
}

async function profileStorageSummary(profiles = null) {
  const data = await storageGet({[PROFILE_CAPTURE_INDEX_KEY]: null, [PROFILE_CAPTURE_KEY]: []});
  const index = data[PROFILE_CAPTURE_INDEX_KEY];
  if (!index && !profiles) {
    const legacy = normalizeProfiles(data[PROFILE_CAPTURE_KEY]);
    return {count: legacy.length, chunks: 0, bytes: estimateJsonBytes(legacy)};
  }
  const count = profiles ? profiles.length : Number(index && index.count) || 0;
  const chunks = index && Array.isArray(index.chunks) ? index.chunks.length : 0;
  const bytes = profiles ? estimateJsonBytes(profiles) : Number(index && index.bytes) || 0;
  return {count, chunks, bytes};
}

async function clearStoredProfiles() {
  const data = await storageGet({[PROFILE_CAPTURE_INDEX_KEY]: null});
  const index = data[PROFILE_CAPTURE_INDEX_KEY];
  const chunks = index && Array.isArray(index.chunks) ? index.chunks.filter(key => String(key).startsWith(PROFILE_CAPTURE_CHUNK_PREFIX)) : [];
  if (chunks.length) await storageRemove(chunks);
  await storageSet({
    [PROFILE_CAPTURE_KEY]: [],
    [PROFILE_CAPTURE_INDEX_KEY]: {version: 1, count: 0, bytes: 0, chunkSize: 100, chunks: [], updatedAt: new Date().toISOString()}
  });
}

async function loadCapabilities() {
  const response = await runtimeSendMessage({type: 'pal-capabilities'});
  capabilities = {
    debugger: !!(response && response.debugger),
    clickMode: response && response.clickMode ? response.clickMode : 'dom'
  };
}

function telegramPatchFromControls() {
  return {
    telegramEnabled: controls.telegramEnabled.checked,
    telegramBotToken: controls.telegramBotToken.value.trim(),
    telegramChatId: controls.telegramChatId.value.trim(),
    telegramMatches: controls.telegramMatches.checked,
    telegramMessages: controls.telegramMessages.checked,
    telegramLikes: controls.telegramLikes.checked,
    telegramCooldownSeconds: Math.max(0, Number.parseInt(controls.telegramCooldownSeconds.value, 10) || 0)
  };
}

function timerPatchFromControls() {
  return {
    autoStopMinutes: normalizeTimerMinutes(controls.autoStopMinutes.value),
    closeTabMinutes: normalizeTimerMinutes(controls.closeTabMinutes.value)
  };
}

function setTelegramStatus(text, state = '') {
  controls.telegramStatus.textContent = text;
  controls.telegramStatus.classList.toggle('ok', state === 'ok');
  controls.telegramStatus.classList.toggle('error', state === 'error');
}

function setProfileCaptureStatus(text, state = '') {
  controls.profileCaptureStatus.textContent = text;
  controls.profileCaptureStatus.classList.toggle('ok', state === 'ok');
  controls.profileCaptureStatus.classList.toggle('error', state === 'error');
}

function renderTelegramStatus(data) {
  controls.telegramPanel.classList.toggle('off', !data.telegramEnabled);
  if (!data.telegramEnabled) {
    setTelegramStatus(t('telegramOff'));
  } else if (!data.telegramBotToken || !data.telegramChatId) {
    setTelegramStatus(t('addToken'), 'error');
  } else {
    setTelegramStatus(t('telegramReady'), 'ok');
  }
}

async function renderProfileCaptureStatus(data) {
  const storage = await profileStorageSummary();
  controls.profileCaptureCount.textContent = String(storage.count);
  if (!data.profileCaptureEnabled) {
    setProfileCaptureStatus(storage.count ? t('captureOffSaved') : t('captureOff'));
  } else {
    setProfileCaptureStatus(t('captureOn'), 'ok');
  }
}

controls.toggle.addEventListener('click', async () => {
  const current = await storedSettings();
  await saveEnabled(!current.enabled);
});

controls.languageToggle.addEventListener('click', async () => {
  const current = await storedSettings();
  const uiLanguage = current.uiLanguage === 'ru' ? 'en' : 'ru';
  const next = normalizeSettings({...current, uiLanguage});
  await storageSet({...next, ...telegramBackupPatch(next)});
  applyLanguage(uiLanguage);
  renderStatus(next);
  renderTimerSettings(next);
  renderTelegramStatus(next);
  await renderProfileCaptureStatus(next);
  renderLicense(currentLicense);
});

for (const key of ['telegramEnabled', 'telegramMatches', 'telegramMessages', 'telegramLikes']) {
  controls[key].addEventListener('change', () => {
    const patch = {[key]: controls[key].checked};
    if (key === 'telegramEnabled') Object.assign(patch, telegramPatchFromControls());
    savePatch(patch).then(async () => renderTelegramStatus(await storedSettings()));
  });
}

controls.profileCaptureEnabled.addEventListener('change', () => {
  savePatch({profileCaptureEnabled: controls.profileCaptureEnabled.checked}).then(async () => {
    renderProfileCaptureStatus(await storageGet(DEFAULTS));
  });
});

for (const key of ['telegramBotToken', 'telegramChatId', 'telegramCooldownSeconds']) {
  controls[key].addEventListener('change', () => savePatch(telegramPatchFromControls()).then(async () => {
    renderTelegramStatus(await storedSettings());
  }));
}

controls.clickJitter.addEventListener('input', () => {
  const value = Number.parseFloat(controls.clickJitter.value) || 0;
  renderJitter(value);
  clearTimeout(clickJitterTimer);
  clickJitterTimer = setTimeout(() => savePatch({clickJitter: value}), 180);
});

controls.clickJitter.addEventListener('change', () => {
  clearTimeout(clickJitterTimer);
  const value = Number.parseFloat(controls.clickJitter.value) || 0;
  savePatch({clickJitter: value});
});

function saveTimerSettings() {
  const patch = timerPatchFromControls();
  controls.autoStopMinutes.value = String(patch.autoStopMinutes);
  controls.closeTabMinutes.value = String(patch.closeTabMinutes);
  renderTimerSettings({...DEFAULTS, ...patch});
  return savePatch(patch);
}

for (const key of ['autoStopMinutes', 'closeTabMinutes']) {
  controls[key].addEventListener('input', () => {
    clearTimeout(timerSettingsTimer);
    timerSettingsTimer = setTimeout(saveTimerSettings, 250);
  });
  controls[key].addEventListener('change', () => {
    clearTimeout(timerSettingsTimer);
    saveTimerSettings();
  });
}

controls.telegramTest.addEventListener('click', async () => {
  controls.telegramTest.disabled = true;
  try {
    const patch = telegramPatchFromControls();
    await savePatch(patch);
    renderTelegramStatus({...DEFAULTS, ...patch});
    const response = await runtimeSendMessage({
      type: 'pal-telegram-test',
      botToken: patch.telegramBotToken,
      chatId: patch.telegramChatId,
      text: 'PureAutoLike: тестовое уведомление'
    });
    if (response && response.ok) setTelegramStatus(t('testSent'), 'ok');
    else setTelegramStatus(response && response.error ? response.error : t('testFailed'), 'error');
  } finally {
    controls.telegramTest.disabled = false;
  }
});

controls.profileCaptureExport.addEventListener('click', async () => {
  controls.profileCaptureExport.disabled = true;
  try {
    try {
      await sendToPure({type: 'pal-profile-captures-flush'});
    } catch (_) {}
    const profiles = await storedProfiles();
    controls.profileCaptureCount.textContent = String(profiles.length);
    if (!profiles.length) {
      setProfileCaptureStatus(t('noProfiles'), 'error');
      return;
    }
    downloadMarkdown(markdownForProfiles(profiles), markdownFilename());
    setProfileCaptureStatus(`${t('exported')}: ${profiles.length}`, 'ok');
  } finally {
    controls.profileCaptureExport.disabled = false;
  }
});

controls.profileCaptureClear.addEventListener('click', async () => {
  controls.profileCaptureClear.disabled = true;
  try {
    await clearStoredProfiles();
    try {
      await sendToPure({type: 'pal-profile-captures-clear'});
    } catch (_) {}
    controls.profileCaptureCount.textContent = '0';
    setProfileCaptureStatus(t('cleared'), 'ok');
  } finally {
    controls.profileCaptureClear.disabled = false;
  }
});

async function refreshStats() {
  if (refreshInFlight) return;
  refreshInFlight = true;
  try {
    const status = await sendToPure({type: 'pal-status'});
    renderRuntime(status || {});
  } catch (error) {
    controls.statusText.textContent = error.message || t('noPureTab');
  }
  try {
    renderTelegramRuntime(await runtimeSendMessage({type: 'pal-telegram-status'}));
  } catch (_) {}
  try {
    const storage = await profileStorageSummary();
    controls.profileCaptureCount.textContent = String(storage.count);
  } finally {
    refreshInFlight = false;
  }
}

function scheduleRefresh(delay = 1000) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    try {
      await refreshStats();
    } finally {
      scheduleRefresh();
    }
  }, delay);
}

loadSettings()
  .then(refreshStats)
  .finally(() => scheduleRefresh());

function storageGet(defaults) {
  const result = ext.storage.local.get(defaults);
  if (result && typeof result.then === 'function') return result;
  return new Promise(resolve => ext.storage.local.get(defaults, resolve));
}

function storageSet(values) {
  const result = ext.storage.local.set(values);
  if (result && typeof result.then === 'function') return result;
  return new Promise(resolve => ext.storage.local.set(values, resolve));
}

function storageRemove(keys) {
  const result = ext.storage.local.remove(keys);
  if (result && typeof result.then === 'function') return result;
  return new Promise(resolve => ext.storage.local.remove(keys, resolve));
}

function tabsQuery(query) {
  const result = ext.tabs.query(query);
  if (result && typeof result.then === 'function') return result;
  return new Promise(resolve => ext.tabs.query(query, resolve));
}

function tabsSendMessage(tabId, message) {
  const result = ext.tabs.sendMessage(tabId, message);
  if (result && typeof result.then === 'function') return result;
  return new Promise((resolve, reject) => {
    ext.tabs.sendMessage(tabId, message, response => {
      const error = ext.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(response);
    });
  });
}

function runtimeSendMessage(message) {
  if (globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.sendMessage) {
    return globalThis.browser.runtime.sendMessage(message).catch(error => ({ok: false, error: error.message || String(error)}));
  }
  return new Promise(resolve => {
    globalThis.chrome.runtime.sendMessage(message, response => {
      const error = globalThis.chrome.runtime.lastError;
      resolve(response || {ok: false, error: error && error.message ? error.message : 'no response'});
    });
  });
}

function markdownFilename() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `pureautolike-profiles-${stamp}.md`;
}

function markdownEscape(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function markdownForProfiles(profiles) {
  const lines = [
    '# PureAutoLike: собранные описания анкет',
    '',
    `Экспорт: ${new Date().toISOString()}`,
    `Всего анкет: ${profiles.length}`,
    '',
    '## Как анализировать',
    '',
    '- Найди повторяющиеся темы, формулировки, интересы и стоп-слова.',
    '- Отдельно оцени статусы/интенты, возрастные группы и текстовые описания.',
    '- Раздели описания по стилям: романтика, юмор, прямой запрос, лайфстайл, red flags.',
    '- Сформулируй выводы, какие описания чаще встречаются и какие гипотезы можно проверить.',
    ''
  ];

  profiles.forEach((profile, index) => {
    lines.push(`## ${index + 1}. Анкета`);
    lines.push('');
    lines.push(`- Собрано: ${profile.capturedAt || '-'}`);
    lines.push(`- Лайков в сессии на момент сбора: ${profile.sessionLikes ?? '-'}`);
    if (profile.status) lines.push(`- Статус/интент: ${markdownEscape(profile.status)}`);
    if (profile.age) lines.push(`- Возраст: ${markdownEscape(profile.age)}`);
    if (profile.label) lines.push(`- Короткая подпись: ${markdownEscape(profile.label)}`);
    if (profile.descriptionKey) lines.push(`- Ключ описания: ${markdownEscape(profile.descriptionKey)}`);
    lines.push('');
    lines.push('### Описание');
    lines.push('');
    lines.push('```text');
    lines.push(markdownEscape(profile.description || profile.text || ''));
    lines.push('```');
    lines.push('');
  });

  return lines.join('\n');
}

function downloadMarkdown(markdown, filename) {
  const blob = new Blob([markdown], {type: 'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
