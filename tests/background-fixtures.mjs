import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(new URL('..', import.meta.url).pathname);
const source = await readFile(resolve(root, 'src/background.js'), 'utf8');
const store = {
  telegramEnabled: true,
  telegramBotToken: '123456:ABC_def-123',
  telegramChatId: '987654',
  telegramMatches: true,
  telegramMessages: true,
  telegramLikes: true,
  telegramCooldownSeconds: 0
};
const fetchCalls = [];
let runtimeListener = null;
let installedListener = null;
let licenseMode = 'beta';

function storagePick(defaults = {}) {
  const out = {};
  for (const [key, value] of Object.entries(defaults)) {
    out[key] = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : value;
  }
  return out;
}

const context = {
  console,
  setTimeout,
  clearTimeout,
  Promise,
  Date,
  String,
  Number,
  Math,
  Set,
  Error,
  fetch: async (url, init = {}) => {
    const value = String(url);
    if (value.includes('/v1/license/check')) {
      fetchCalls.push({kind: 'license', url: value, init});
      if (licenseMode === 'throw') throw new Error('license network down');
      if (licenseMode === 'locked') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ok: true, access: false, mode: 'paid', plan: 'none', label: 'LOCKED', beta: false, reason: 'subscription_required'})
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ok: true, access: true, mode: 'beta', plan: 'beta', label: 'BETA', beta: true, reason: 'beta_enabled'})
      };
    }
    fetchCalls.push({kind: 'telegram', url: value, init});
    return {
      ok: true,
      status: 200,
      json: async () => ({ok: true, result: {message_id: 1}})
    };
  },
  chrome: {
    runtime: {
      id: 'test-extension-id',
      lastError: null,
      getManifest() {
        return {version: '0.1.32'};
      },
      onInstalled: {
        addListener(listener) {
          installedListener = listener;
        }
      },
      onMessage: {
        addListener(listener) {
          runtimeListener = listener;
        }
      }
    },
    storage: {
      local: {
        get(defaults) {
          return Promise.resolve(storagePick(defaults));
        },
        set(values) {
          Object.assign(store, values);
          return Promise.resolve();
        },
        remove(keys) {
          for (const key of Array.isArray(keys) ? keys : [keys]) delete store[key];
          return Promise.resolve();
        }
      }
    },
    tabs: {
      get: () => Promise.resolve(null),
      update: () => Promise.resolve(null),
      remove: () => Promise.resolve(),
      sendMessage: () => Promise.resolve({ok: true}),
      onRemoved: {addListener() {}}
    },
    alarms: {
      create: () => Promise.resolve(),
      clear: () => Promise.resolve(true),
      onAlarm: {addListener() {}}
    },
    debugger: {
      attach() {},
      detach() {},
      sendCommand() {},
      onDetach: {addListener() {}}
    }
  }
};
context.globalThis = context;

vm.runInNewContext(source, context, {filename: 'src/background.js'});
assert(runtimeListener, 'background must register runtime.onMessage listener');
assert(installedListener, 'background must register runtime.onInstalled migration listener');

await installedListener({reason: 'update'});
assert(store.palTelegramConfigBackup, 'telegram migration must persist a backup config');
assert(store.palTelegramConfigBackup.telegramBotToken === '123456:ABC_def-123', 'telegram backup must preserve bot token');
assert(store.palTelegramConfigBackup.telegramChatId === '987654', 'telegram backup must preserve chat id');

function sendMessage(message) {
  return new Promise(resolve => {
    const keepAlive = runtimeListener(message, {}, resolve);
    if (keepAlive !== true) resolve(undefined);
  });
}

let response = await sendMessage({
  type: 'pal-telegram-event',
  signal: {
    kind: 'message',
    dedupeKey: 'message-1',
    title: 'PureAutoLike',
    body: 'Новое сообщение',
    text: 'Привет',
    botToken: '999999:SHOULD_NOT_BE_USED'
  }
});
const telegramCalls = () => fetchCalls.filter(call => call.kind === 'telegram');
assert(response && response.ok, 'telegram event must send successfully');
assert(telegramCalls().length === 1, 'telegram event must call Telegram API once');
assert(telegramCalls()[0].url.includes('/bot123456:ABC_def-123/sendMessage'), 'telegram event must use token from extension storage');
assert(!telegramCalls()[0].url.includes('SHOULD_NOT_BE_USED'), 'telegram event must ignore token-like signal fields');
assert(JSON.parse(telegramCalls()[0].init.body).text.includes('Привет'), 'telegram event must include message text');
assert(store.palTelegramState && store.palTelegramState.sent === 1, 'telegram state must persist sent count');

response = await sendMessage({
  type: 'pal-telegram-event',
  signal: {
    kind: 'message',
    dedupeKey: 'message-1',
    title: 'PureAutoLike',
    body: 'Новое сообщение',
    text: 'Привет again'
  }
});
assert(response && response.duplicate, 'duplicate telegram event must be reported as duplicate');
assert(telegramCalls().length === 1, 'duplicate telegram event must not send another Telegram request');

response = await sendMessage({type: 'pal-telegram-status'});
assert(response && response.ok && response.configured && response.sent === 1, 'telegram status must expose background runtime state');

store.telegramBotToken = '';
store.telegramChatId = '';
response = await sendMessage({type: 'pal-telegram-status'});
assert(response && response.configured, 'telegram status must restore missing secrets from backup');
assert(store.telegramBotToken === '123456:ABC_def-123', 'telegram bot token must be restored from backup');
assert(store.telegramChatId === '987654', 'telegram chat id must be restored from backup');

response = await sendMessage({type: 'pal-license-check', force: true});
assert(response && response.access === true && response.label === 'BETA', 'license beta response must allow the current free beta');

licenseMode = 'locked';
response = await sendMessage({type: 'pal-license-check', force: true});
assert(response && response.access === false && response.label === 'LOCKED', 'license locked response must block the runner');

licenseMode = 'throw';
response = await sendMessage({type: 'pal-license-check', force: true});
assert(response && response.access === false && response.label === 'LOCKED', 'license network failure must not fall back to free local beta');

console.log('background fixture validation passed');
