import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(new URL('..', import.meta.url).pathname);
const source = await readFile(resolve(root, 'src/page-bridge.js'), 'utf8');
const hooks = {__enabled: true};
const context = {
  __PAL_TEST_HOOKS__: hooks,
  location: {hostname: 'pure.app', href: 'https://pure.app/app/ru/feed'},
  document: {
    currentScript: {dataset: {palChannel: 'test-channel'}},
    querySelector: () => null
  },
  Headers,
  Request,
  URL,
  Date,
  JSON,
  String,
  Number,
  Array,
  Object,
  Map,
  Set,
  Promise,
  Math,
  console,
  atob: value => Buffer.from(value, 'base64').toString('binary'),
  fetch: () => Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers(),
    clone() {
      return {text: () => Promise.resolve('')};
    }
  }),
  postMessage: () => {},
  addEventListener: () => {},
  CSS: {escape: value => String(value).replace(/"/g, '\\"')},
  WebSocket: function WebSocket() {},
  XMLHttpRequest: function XMLHttpRequest() {}
};
context.XMLHttpRequest.prototype.open = function open() {};
context.XMLHttpRequest.prototype.setRequestHeader = function setRequestHeader() {};
context.XMLHttpRequest.prototype.send = function send() {};
context.window = context;
context.globalThis = context;

vm.runInNewContext(source, context, {filename: 'src/page-bridge.js'});

const photo = hooks.photoOpener;
assert(photo, 'page bridge must expose photo opener test hooks');

function fakeElement(attrs = {}) {
  return {
    ...attrs,
    getAttribute(name) {
      return this.__attrs && this.__attrs[name] || '';
    },
    setAttribute(name, value) {
      this.__attrs = this.__attrs || {};
      this.__attrs[name] = String(value);
    },
    querySelectorAll() {
      return [];
    }
  };
}

const liveRoot = fakeElement({
  __attrs: {'data-pal-photo-key': 'photo-key-1'},
  '__reactProps$fixture': {
    chatId: 'chat-thread-1',
    message: {
      messageId: 'message-1',
      p: 'photo-1',
      u: 'peer-1'
    }
  }
});

const live = photo.extractPhotoMeta(liveRoot);
assert(live.photoId === 'photo-1', 'extractPhotoMeta must read photo id from React props');
assert(live.peerUserId === 'peer-1', 'extractPhotoMeta must read peer user id from React props');
assert(live.messageId === 'message-1', 'extractPhotoMeta must read message id from React props');

photo.rememberPhotoMeta('photo-key-1', live);
const staleRoot = fakeElement({__attrs: {'data-pal-photo-key': 'photo-key-1'}});
const restored = photo.resolvePhotoMetaForRoot(staleRoot);
assert(restored.photoId === 'photo-1', 'cached photo id must restore stale roots');
assert(restored.peerUserId === 'peer-1', 'cached peer user id must restore stale roots');
assert(restored.messageId === 'message-1', 'cached message id must restore stale roots');

photo.rememberPhotoMeta('photo-key-2', {
  photoId: 'old-photo',
  peerUserId: 'old-peer',
  messageId: 'old-message',
  chatId: 'chat-thread-2',
  channelName: ''
});
const changedRoot = fakeElement({
  __attrs: {'data-pal-photo-key': 'photo-key-2'},
  '__reactProps$fixture': {
    messageId: 'new-message'
  }
});
const changed = photo.resolvePhotoMetaForRoot(changedRoot);
assert(changed.messageId === 'new-message', 'live message id must win over cached message id');
assert(!changed.photoId, 'old cached photo id must not be merged into a different live message');

photo.rememberPhotoMeta('photo-key-3', {
  photoId: 'old-photo',
  peerUserId: 'old-peer',
  messageId: '',
  chatId: '',
  channelName: ''
});
const changedPhotoRoot = fakeElement({
  __attrs: {'data-pal-photo-key': 'photo-key-3'},
  '__reactProps$fixture': {
    photoId: 'new-photo'
  }
});
const changedPhoto = photo.resolvePhotoMetaForRoot(changedPhotoRoot);
assert(changedPhoto.photoId === 'new-photo', 'live photo id must win over cached photo id');
assert(!changedPhoto.peerUserId, 'old cached peer id must not be merged into a different live photo');

console.log('photo opener fixture validation passed');
