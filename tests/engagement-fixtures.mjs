import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(new URL('..', import.meta.url).pathname);
const source = await readFile(resolve(root, 'src/content.js'), 'utf8');
const hooks = {__enabled: true};
const context = {
  __PAL_TEST_HOOKS__: hooks,
  location: {hostname: 'pure.app'},
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
        set: () => Promise.resolve()
      },
      onChanged: {addListener: () => {}}
    }
  },
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Math,
  Date,
  JSON,
  String,
  Number,
  Array,
  Object,
  Promise,
  document: {hidden: false},
  URL,
  atob: value => Buffer.from(value, 'base64').toString('binary')
};
context.getComputedStyle = () => ({backgroundImage: 'none'});
context.globalThis = context;
context.window = context;

vm.runInNewContext(source, context, {filename: 'src/content.js'});
const engagement = hooks.engagement;
assert(engagement, 'content test hooks must expose engagement parser');
const profileCapture = hooks.profileCapture;
assert(profileCapture, 'content test hooks must expose profile capture parser');

function wsEvent(payload, ts = 1781303000) {
  return {
    kind: 'ws_recv',
    ts,
    url: 'wss://x6.thepure.app/connection/websocket',
    wsPayload: JSON.stringify(payload)
  };
}

function chatWsEvent(payload, ts = 1781303000, kind = 'ws_recv') {
  return {
    kind,
    ts,
    url: 'wss://chats.thepure.app/chats-service/v1/ws/',
    wsPayload: JSON.stringify(payload)
  };
}

function responseEvent(path, body, ts = 1781303000) {
  return {
    kind: 'response',
    ts,
    method: 'GET',
    status: 200,
    url: `https://api.thepure.app${path}`,
    bodyText: JSON.stringify(body)
  };
}

const direct = engagement.createEngagementDetector();
let signals = direct.scan(wsEvent({
  push: {
    channel: 'chat.thread-1',
    pub: {
      data: {
        message: {
          id: 'msg-1',
          u: 'peer-1',
          t: 1781303000,
          m: 'Привет'
        }
      }
    }
  }
}));
assert(signals.length === 1, 'direct chat publication must notify once');
assert(signals[0].kind === 'message', 'direct chat publication must be a message');
assert(signals[0].text === 'Привет', 'direct chat publication must keep text');
assert(direct.scan(wsEvent({
  push: {
    channel: 'chat.thread-1',
    pub: {data: {message: {id: 'msg-1', u: 'peer-1', m: 'Привет'}}}
  }
})).length === 0, 'message dedupe must suppress repeated frame');

const enveloped = engagement.createEngagementDetector();
signals = enveloped.scan(wsEvent({
  push: {
    channel: 'personal:#me',
    pub: {
      data: {
        module: 'chat',
        action: 'message_added',
        data: {
          channelName: 'chat.thread-2',
          message: {
            id: 'msg-2',
            u: 'peer-2',
            t: 1781303010,
            m: 'Есть кто?'
          }
        }
      }
    }
  }
}, 1781303010));
assert(signals.length === 1, 'Pure chat module envelope must notify once');
assert(signals[0].kind === 'message', 'Pure chat module envelope must be a message');
assert(signals[0].threadId === 'chat.thread-2', 'Pure chat module envelope must resolve thread id');
assert(signals[0].text === 'Есть кто?', 'Pure chat module envelope must keep nested message text');

const echo = engagement.createEngagementDetector();
const outgoing = {
  publish: {
    channel: 'chat.thread-3',
    data: {
      data: {
        message: {
          id: 'msg-3',
          u: 'me',
          t: 1781303020,
          m: 'Это я'
        }
      }
    }
  }
};
echo.scan({
  kind: 'ws_send',
  ts: 1781303020,
  url: 'wss://x6.thepure.app/connection/websocket',
  wsPayload: JSON.stringify(outgoing)
});
signals = echo.scan(wsEvent({
  push: {
    channel: 'chat.thread-3',
    pub: {
      data: {
        message: {
          id: 'msg-3',
          u: 'me',
          t: 1781303020,
          m: 'Это я'
        }
      }
    }
  }
}, 1781303021));
assert(signals.length === 0, 'outgoing echo must not notify as incoming');

const chatServiceGeneric = engagement.createEngagementDetector();
signals = chatServiceGeneric.scan(chatWsEvent({
  channel: 'chat.thread-4',
  event: {
    type: 'text',
    u: 'peer-4',
    t: 1781303030
  }
}, 1781303030));
assert(signals.length === 1, 'chat-service ws text event must notify once');
assert(signals[0].kind === 'message', 'chat-service ws text event must be a message');
assert(signals[0].threadId === 'chat.thread-4', 'chat-service ws event must resolve channel thread');
assert(signals[0].text === '', 'chat-service ws marker may notify without text body');

const chatServiceHistory = engagement.createEngagementDetector();
signals = chatServiceHistory.scan(chatWsEvent({
  channel: 'chat.thread-5',
  event: {
    t: 1781303040,
    h: {
      u: 'peer-5',
      d: 'chat.thread-5',
      m: {
        id: 'msg-5',
        u: 'peer-5',
        t: 1781303040,
        m: 'История из ws'
      }
    }
  }
}, 1781303040));
assert(signals.length === 0, 'first chat-service ws history event must baseline without Telegram spam');
signals = chatServiceHistory.scan(chatWsEvent({
  channel: 'chat.thread-5',
  event: {
    t: 1781303042,
    h: {
      u: 'peer-5',
      d: 'chat.thread-5',
      m: {
        id: 'msg-5-new',
        u: 'peer-5',
        t: 1781303042,
        m: 'Новая история из ws'
      }
    }
  }
}, 1781303042));
assert(signals.length === 1, 'chat-service ws history after baseline must notify for a new message');
assert(signals[0].text === 'Новая история из ws', 'chat-service ws history event must keep nested message text');

const chatServiceEcho = engagement.createEngagementDetector();
chatServiceEcho.scan(chatWsEvent({
  channel: 'chat.thread-6',
  event: {
    type: 'text',
    u: 'me',
    t: 1781303050
  }
}, 1781303050, 'ws_send'));
signals = chatServiceEcho.scan(chatWsEvent({
  channel: 'chat.thread-6',
  event: {
    type: 'text',
    u: 'me',
    t: 1781303050
  }
}, 1781303051));
assert(signals.length === 0, 'chat-service outgoing echo must not notify as incoming');

const historyResponse = engagement.createEngagementDetector();
signals = historyResponse.scan(responseEvent('/chats-service/v1/chats/chat.thread-7/history/', [{
  id: 10,
  user_id: 'peer-7',
  message_id: 'msg-7',
  channel: 'chat.thread-7',
  chat_id: 'chat.thread-7',
  sent_at: '2026-06-12T22:24:20.000Z',
  message: {
    id: 'msg-7',
    u: 'peer-7',
    t: 1781303060,
    m: 'История из REST'
  },
  read_status: false,
  reactions: null
}], 1781303060));
assert(signals.length === 0, 'first fresh REST chat history must baseline without Telegram spam');
assert(historyResponse.scan(responseEvent('/chats-service/v1/chats/chat.thread-7/history/', [{
  id: 10,
  user_id: 'peer-7',
  message_id: 'msg-7',
  channel: 'chat.thread-7',
  chat_id: 'chat.thread-7',
  sent_at: '2026-06-12T22:24:20.000Z',
  message: {id: 'msg-7', u: 'peer-7', t: 1781303060, m: 'История из REST'}
}], 1781303061)).length === 0, 'REST chat history message dedupe must suppress repeated response');
signals = historyResponse.scan(responseEvent('/chats-service/v1/chats/chat.thread-7/history/', [{
  id: 10,
  user_id: 'peer-7',
  message_id: 'msg-7',
  channel: 'chat.thread-7',
  chat_id: 'chat.thread-7',
  sent_at: '2026-06-12T22:24:20.000Z',
  message: {id: 'msg-7', u: 'peer-7', t: 1781303060, m: 'История из REST'}
}, {
  id: 12,
  user_id: 'peer-7',
  message_id: 'msg-7-new',
  channel: 'chat.thread-7',
  chat_id: 'chat.thread-7',
  sent_at: '2026-06-12T22:24:24.000Z',
  message: {id: 'msg-7-new', u: 'peer-7', t: 1781303064, m: 'Новая история из REST'}
}], 1781303064));
assert(signals.length === 1, 'REST chat history after baseline must notify for a new message');
assert(signals[0].text === 'Новая история из REST', 'REST chat history must keep nested message text');

const oldHistoryResponse = engagement.createEngagementDetector();
signals = oldHistoryResponse.scan(responseEvent('/chats-service/v1/chats/chat.thread-8/history/', [{
  id: 11,
  user_id: 'peer-8',
  message_id: 'msg-8',
  channel: 'chat.thread-8',
  chat_id: 'chat.thread-8',
  sent_at: '2026-06-12T21:00:00.000Z',
  message: {id: 'msg-8', u: 'peer-8', t: 1781298000, m: 'Старая история'}
}], 1781303060));
assert(signals.length === 0, 'old REST chat history must baseline without Telegram spam');

const profile = profileCapture.profileFieldsFromText([
  'EN / RU',
  '🫶 ВСЁ, ВЕЗДЕ И СРАЗУ. Нежный цветочек, никаких фемдом',
  'Уважение, ум и юмор',
  'Москва, девушка',
  '28 лет, 175 см',
  '24 км, онлайн'
].join('\n'));
assert(profile.status === 'Всё, везде и сразу', 'profile parser must extract Pure status');
assert(profile.age === '28', 'profile parser must extract age');
assert(profile.description === 'Нежный цветочек, никаких фемдом\nУважение, ум и юмор', 'profile parser must keep only description lines');
assert(profile.descriptionKey, 'profile parser must create description key');
assert(profile.descriptionKey === profileCapture.descriptionKeyForText('Нежный цветочек, никаких фемдом Уважение, ум и юмор'), 'same description must get the same dedupe key');

const serious = profileCapture.profileFieldsFromText('DE / EN / RU БЕЗ ОБЯЗАТЕЛЬСТВ. ищу fwb ✨\n29 лет\n5 Соблазнов.');
assert(serious.status === 'Без обязательств', 'profile parser must extract no-obligation status');
assert(serious.age === '29', 'profile parser must extract age from compact card text');
assert(serious.description === 'ищу fwb ✨', 'profile parser must strip status from description');

const alreadyLikedCard = {
  innerText: [
    'DE / EN / RU',
    'БЕЗ ОБЯЗАТЕЛЬСТВ. Уже пролайканная анкета',
    'ищу быстрый вечер',
    '29 лет',
    '5 км, онлайн'
  ].join('\n'),
  querySelectorAll(selector) {
    if (selector === 'img') return [{src: 'https://cdn.thepure.app/feed/profile-image-aaaaaaaaaaaaaaaa.webp'}];
    return [];
  },
  getBoundingClientRect() {
    return {top: 120, bottom: 420, right: 900, width: 620, height: 300};
  }
};
const alreadyLikedCandidate = profileCapture.profileCandidateFromCard(alreadyLikedCard);
assert(alreadyLikedCandidate, 'profile card without a like button must still become a capture candidate');
assert(alreadyLikedCandidate.description === 'Уже пролайканная анкета\nищу быстрый вечер', 'capture candidate must preserve already-liked profile text');
assert(alreadyLikedCandidate.profile.status === 'Без обязательств', 'capture candidate must preserve status');
assert(alreadyLikedCandidate.profile.age === '29', 'capture candidate must preserve age');
assert(alreadyLikedCandidate.signature.startsWith('img:'), 'capture candidate must use profile media for dedupe when available');
assert(profileCapture.isPositiveLikeLabel('Like'), 'like label fallback must recognize English like buttons');
assert(profileCapture.isPositiveLikeLabel('Поставить лайк'), 'like label fallback must recognize Russian like buttons');
assert(!profileCapture.isPositiveLikeLabel('Скинуть фото'), 'like label fallback must not treat unrelated controls as like buttons');
assert(profileCapture.isLikeButton({
  innerText: '',
  getAttribute(name) {
    return name === 'aria-label' ? 'Поставить лайк' : '';
  },
  querySelector() {
    return null;
  }
}), 'like button detector must work without a known heart svg path');
assert(!profileCapture.isLikeButton({
  innerText: 'Скинуть фото',
  getAttribute() {
    return '';
  },
  querySelector() {
    return null;
  }
}), 'like button detector must avoid known non-like controls');

let rafCalls = 0;
context.document.hidden = false;
context.requestAnimationFrame = () => {
  rafCalls += 1;
  return 1;
};
let frameResolved = await Promise.race([
  profileCapture.nextFrame().then(() => true),
  new Promise(resolve => setTimeout(() => resolve(false), 180))
]);
assert(frameResolved, 'nextFrame must resolve even when requestAnimationFrame is paused');
assert(rafCalls === 1, 'nextFrame should still prefer requestAnimationFrame on visible tabs');

context.document.hidden = true;
context.requestAnimationFrame = () => {
  throw new Error('requestAnimationFrame should not run for hidden documents');
};
frameResolved = await Promise.race([
  profileCapture.nextFrame().then(() => true),
  new Promise(resolve => setTimeout(() => resolve(false), 180))
]);
assert(frameResolved, 'nextFrame must use a timer fallback for hidden tabs');

console.log('engagement fixture validation passed');
