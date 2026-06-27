import { mkdir, writeFile } from 'node:fs/promises';

const siteRoot = new URL('../site/', import.meta.url);
const baseUrl = 'https://zgnoff.github.io/pureautolike';
const storeUrl = 'https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm';
const modified = '2026-06-27';

const pages = [
  {
    lang: 'ru',
    slug: 'rabochiy-avtolayker-pure',
    counterpart: 'working-pure-auto-liker',
    title: 'Рабочий автолайкер Pure для Pure Web | PureAutoLike',
    description: 'Рабочий автолайкер Pure для веб-версии: PureAutoLike ставит видимые лайки в открытой вкладке Pure Web, поддерживает Telegram и доступные фото.',
    label: 'Рабочий автолайкер',
    h1: 'Рабочий автолайкер Pure для открытой вкладки Pure Web.',
    lead: 'PureAutoLike работает как Chrome-расширение внутри браузерного профиля, где уже открыт Pure Web. Это не отдельный desktop-бот и не автокликер по координатам.',
    chips: ['рабочий автолайкер Pure', 'автолайк Pure Web', 'Пьюр автолайк', 'Chrome расширение Pure', 'PureAutoLike beta'],
    sections: [
      ['Что значит “рабочий”', 'Расширение выполняет конкретный browser-flow: ищет видимые лайки в открытой вкладке Pure Web, кликает их и пропускает уже обработанные карточки текущей сессии.'],
      ['Что не обещает', 'PureAutoLike не гарантирует матчи, не делает разбан, не меняет геопозицию и не управляет ранжированием Pure.'],
      ['Когда подходит', 'Если нужно убрать ручную рутину лайков в веб-версии Pure и получать Telegram-события по матчам, лайкам и сообщениям.']
    ],
    faq: [
      ['Это реально работает?', 'Да, для заявленного сценария: видимые лайки в открытой вкладке Pure Web.'],
      ['Это бесплатно?', 'Текущая публичная beta бесплатная.'],
      ['Это заменяет Pure?', 'Нет, PureAutoLike работает только поверх уже открытой Pure Web-сессии.']
    ]
  },
  {
    lang: 'ru',
    slug: 'novyy-avtolayker-pure-2026',
    counterpart: 'new-pure-auto-liker-2026',
    title: 'Новый автолайкер Pure 2026 | Beta PureAutoLike',
    description: 'Новый автолайкер Pure 2026: beta-расширение PureAutoLike для Pure Web, автолайк видимых анкет, Telegram-уведомления и локальный экспорт.',
    label: 'Новый в 2026',
    h1: 'Новый автолайкер Pure для 2026 года.',
    lead: 'PureAutoLike сделан как новый минимальный WebExtension-продукт: без тяжелого приложения, без лишней панели и с понятной установкой через Chrome Web Store.',
    chips: ['новый автолайкер Pure', 'Pure 2026', 'PureAutoLike beta', 'автолайкер Пьюр', 'бесплатная beta'],
    sections: [
      ['Почему новая страница', 'Запросы меняются: люди ищут свежий рабочий инструмент, который актуален для текущего Pure Web workflow.'],
      ['Что внутри', 'Автолайк видимой ленты, открытие доступных фото, Telegram-события, таймеры и локальный Markdown-экспорт.'],
      ['Почему не обещаем лишнего', 'Инструмент помогает с рутиной, но не может управлять модерацией, показами, геопозицией или ответами пользователей.']
    ],
    faq: [
      ['Это новый продукт?', 'Да, PureAutoLike опубликован как новая публичная beta.'],
      ['Где установить?', 'Основной путь - Chrome Web Store.'],
      ['Нужен отдельный бот?', 'Нет, расширение работает внутри браузера.']
    ]
  },
  {
    lang: 'ru',
    slug: 'chrome-rasshirenie-dlya-pure',
    counterpart: 'chrome-extension-for-pure',
    title: 'Chrome расширение для Pure Web | PureAutoLike',
    description: 'Chrome расширение для Pure Web: автолайк видимых анкет, открытие доступных фото, Telegram-уведомления, таймеры и локальный экспорт.',
    label: 'Chrome extension',
    h1: 'Chrome расширение для Pure Web вместо отдельного автокликера.',
    lead: 'PureAutoLike устанавливается как расширение и работает в том же браузерном профиле, где уже открыт Pure Web.',
    chips: ['Chrome расширение Pure', 'Pure Web extension', 'Pure автолайк Chrome', 'расширение для Pure', 'WebExtension'],
    sections: [
      ['Почему расширение', 'Расширение ближе к странице, чем внешний автокликер: оно работает внутри браузерного контекста, а не по фиксированным координатам экрана.'],
      ['Какие браузеры', 'Основной публичный канал - Chrome Web Store. Chromium-браузеры близки по модели, но публичная установка сейчас ориентирована на Chrome.'],
      ['Приватность', 'Настройки хранятся в storage расширения, Telegram включается вручную, сторонней аналитики в расширении нет.']
    ],
    faq: [
      ['Это работает в Safari?', 'Публичный one-click канал сейчас Chrome Web Store.'],
      ['Нужно скачивать ZIP?', 'Для обычных пользователей лучше Chrome Web Store.'],
      ['Это безопаснее автокликера?', 'Оно прозрачнее по сценарию, но использовать нужно с учетом правил сервиса.']
    ]
  },
  {
    lang: 'ru',
    slug: 'pure-telegram-uvedomleniya',
    counterpart: 'pure-telegram-notifications',
    title: 'Telegram уведомления Pure | PureAutoLike',
    description: 'Telegram уведомления для Pure Web: PureAutoLike может отправлять события о матчах, лайках и сообщениях при ручном включении Telegram.',
    label: 'Telegram',
    h1: 'Telegram-уведомления для Pure Web вместе с автолайком.',
    lead: 'PureAutoLike может присылать Telegram-события, когда в Pure появляются матчи, лайки или сообщения. Функция выключена по умолчанию и включается вручную.',
    chips: ['Telegram Pure', 'уведомления Pure', 'матчи Pure', 'сообщения Pure', 'PureAutoLike Telegram'],
    sections: [
      ['Что отправляется', 'События о матчах, лайках и сообщениях, если пользователь сам ввел bot token и chat id.'],
      ['Почему это важно', 'Автолайк убирает рутину, а Telegram помогает быстрее заметить событие, на которое стоит реагировать.'],
      ['Граница приватности', 'Token и chat id хранятся в extension storage и используются только для Telegram Bot API при включенной функции.']
    ],
    faq: [
      ['Telegram обязателен?', 'Нет, функция опциональная.'],
      ['Где хранится token?', 'В storage расширения.'],
      ['Можно отключить?', 'Да, Telegram можно не включать или выключить.']
    ]
  },
  {
    lang: 'ru',
    slug: 'otkrytie-foto-pure-web',
    counterpart: 'pure-photo-opener',
    title: 'Открытие фото Pure Web | PureAutoLike',
    description: 'Открытие доступных фото Pure Web: PureAutoLike добавляет сценарий для фото, к которым текущая Pure-сессия уже имеет доступ.',
    label: 'Фото Pure',
    h1: 'Открытие доступных фото Pure Web без отдельного приложения.',
    lead: 'PureAutoLike помогает открыть фото только в рамках текущей Pure Web-сессии, когда доступ уже есть. Это не обход доступа и не взлом.',
    chips: ['фото Pure', 'скрытые фото Pure', 'открытие фото Pure Web', 'Pure photo opener', 'доступные фото'],
    sections: [
      ['Что делает', 'Добавляет удобный page-flow для фото, доступных активной веб-сессии Pure.'],
      ['Что не делает', 'Не обещает обход закрытого доступа и не хранит Pure authorization header в настройках расширения.'],
      ['Зачем вместе с автолайком', 'Лайки, события и доступные фото находятся в одном маленьком расширении вместо набора отдельных инструментов.']
    ],
    faq: [
      ['Это открывает любые фото?', 'Нет, только доступные текущей сессии.'],
      ['Токен Pure сохраняется?', 'Нет, не сохраняется в настройках расширения.'],
      ['Работает без Pure Web?', 'Нет, нужна открытая Pure Web-сессия.']
    ]
  },
  {
    lang: 'ru',
    slug: 'pure-bot-alternativa',
    counterpart: 'pure-bot-alternative',
    title: 'Pure бот или расширение? Альтернатива боту Pure | PureAutoLike',
    description: 'PureAutoLike как альтернатива Pure-боту: расширение для Pure Web с автолайком, Telegram-уведомлениями, фото и локальным экспортом.',
    label: 'Альтернатива боту',
    h1: 'PureAutoLike: альтернатива Pure-боту в формате расширения.',
    lead: 'Многие ищут “бот Pure” или “пьюр бот”, но для автолайка в Pure Web часто достаточно браузерного расширения без отдельного сервера или desktop-приложения.',
    chips: ['бот Pure', 'пьюр бот', 'альтернатива боту Pure', 'Pure Web automation', 'автолайкер Pure'],
    sections: [
      ['Почему не бот', 'Расширение работает там, где уже открыт Pure Web, и не пытается заменить аккаунт или общение отдельным ботом.'],
      ['Что автоматизирует', 'Видимые лайки, доступные фото, Telegram-события, таймеры и локальный экспорт описаний.'],
      ['Честная граница', 'PureAutoLike не переписывается за пользователя и не гарантирует ответы.']
    ],
    faq: [
      ['Это бот?', 'Нет, это браузерное расширение.'],
      ['Оно пишет сообщения?', 'Нет, оно не ведет переписку за пользователя.'],
      ['Зачем тогда Telegram?', 'Чтобы уведомлять о событиях, а не заменять общение.']
    ]
  },
  {
    lang: 'en',
    slug: 'working-pure-auto-liker',
    counterpart: 'rabochiy-avtolayker-pure',
    title: 'Working Pure Auto Liker for Pure Web | PureAutoLike',
    description: 'Working Pure auto liker for Pure Web: PureAutoLike runs in the open Pure Web tab, clicks visible likes, supports Telegram alerts and accessible photos.',
    label: 'Working auto liker',
    h1: 'Working Pure auto liker for the open Pure Web tab.',
    lead: 'PureAutoLike is a Chrome extension that runs in the browser profile where Pure Web is already open. It is not a coordinate-based desktop autoclicker.',
    chips: ['working Pure auto liker', 'Pure Web auto like', 'PureAutoLike beta', 'Chrome extension for Pure', 'Pure automation'],
    sections: [
      ['What working means', 'The extension performs a specific browser flow: visible likes in the open Pure Web tab with a session duplicate guard.'],
      ['What it does not promise', 'It does not guarantee matches, unban, ranking changes, replies, or geolocation changes.'],
      ['When it fits', 'When you want to reduce repetitive Pure Web feed work and receive optional Telegram alerts.']
    ],
    faq: [
      ['Does it work?', 'Yes, for the stated visible-like browser flow.'],
      ['Is it free?', 'The current public beta is free.'],
      ['Does it replace Pure?', 'No, it works on top of an open Pure Web session.']
    ]
  },
  {
    lang: 'en',
    slug: 'new-pure-auto-liker-2026',
    counterpart: 'novyy-avtolayker-pure-2026',
    title: 'New Pure Auto Liker 2026 | PureAutoLike Beta',
    description: 'New Pure auto liker for 2026: PureAutoLike beta for Pure Web with visible-feed auto-like, Telegram alerts, accessible photos, and local export.',
    label: 'New in 2026',
    h1: 'New Pure auto liker for 2026.',
    lead: 'PureAutoLike is a new lightweight WebExtension product: no separate desktop app, no heavy control panel, and a clear Chrome Web Store install path.',
    chips: ['new Pure auto liker', 'Pure 2026', 'PureAutoLike beta', 'free beta', 'Pure Web extension'],
    sections: [
      ['Why a new page', 'Users search for fresh tools that match the current Pure Web workflow.'],
      ['What is included', 'Visible-feed auto-like, accessible photo opening, Telegram events, timers, and local Markdown export.'],
      ['No extra promises', 'The extension helps with repetitive work but does not control moderation, ranking, location, or replies.']
    ],
    faq: [
      ['Is it new?', 'Yes, PureAutoLike is a new public beta.'],
      ['Where do I install it?', 'The main path is Chrome Web Store.'],
      ['Do I need a separate bot?', 'No, it runs in the browser.']
    ]
  },
  {
    lang: 'en',
    slug: 'chrome-extension-for-pure',
    counterpart: 'chrome-rasshirenie-dlya-pure',
    title: 'Chrome Extension for Pure Web | PureAutoLike',
    description: 'Chrome extension for Pure Web: visible-feed auto-like, accessible photo opening, Telegram notifications, timers, and local export.',
    label: 'Chrome extension',
    h1: 'Chrome extension for Pure Web instead of a desktop autoclicker.',
    lead: 'PureAutoLike installs as a browser extension and works in the same browser profile where Pure Web is already open.',
    chips: ['Chrome extension for Pure', 'Pure Web extension', 'Pure auto liker Chrome', 'WebExtension', 'Pure automation'],
    sections: [
      ['Why an extension', 'A browser extension stays closer to the page than a fixed-coordinate autoclicker.'],
      ['Browser support', 'The public one-click install path is Chrome Web Store. Chromium browsers are close, but public distribution is focused on Chrome.'],
      ['Privacy position', 'Settings stay in extension storage, Telegram is manual, and the extension has no third-party analytics.']
    ],
    faq: [
      ['Does it work in Safari?', 'The public one-click channel is Chrome Web Store right now.'],
      ['Do I need a ZIP?', 'For regular users, Chrome Web Store is preferred.'],
      ['Is it safer than an autoclicker?', 'It is more transparent for this specific workflow, but use it within service rules.']
    ]
  },
  {
    lang: 'en',
    slug: 'pure-telegram-notifications',
    counterpart: 'pure-telegram-uvedomleniya',
    title: 'Pure Telegram Notifications | PureAutoLike',
    description: 'Pure Telegram notifications for Pure Web: PureAutoLike can send match, like, and message events when Telegram alerts are enabled manually.',
    label: 'Telegram',
    h1: 'Telegram notifications for Pure Web events.',
    lead: 'PureAutoLike can send Telegram alerts when Pure has matches, likes, or messages. The feature is off by default and enabled manually.',
    chips: ['Pure Telegram notifications', 'Pure matches alerts', 'Pure messages', 'Telegram bot Pure', 'PureAutoLike Telegram'],
    sections: [
      ['What is sent', 'Events for matches, likes, and messages when the user enters a bot token and chat id.'],
      ['Why it helps', 'Auto-like removes repetitive feed work; Telegram helps you notice events worth reacting to.'],
      ['Privacy boundary', 'Token and chat id are stored in extension storage and used only for Telegram Bot API when enabled.']
    ],
    faq: [
      ['Is Telegram required?', 'No, it is optional.'],
      ['Where is the token stored?', 'In extension storage.'],
      ['Can I disable it?', 'Yes.']
    ]
  },
  {
    lang: 'en',
    slug: 'pure-photo-opener',
    counterpart: 'otkrytie-foto-pure-web',
    title: 'Pure Photo Opener for Pure Web | PureAutoLike',
    description: 'Pure photo opener for Pure Web: PureAutoLike helps open photos that the current Pure Web session can already access.',
    label: 'Pure photos',
    h1: 'Pure photo opener for accessible Pure Web photos.',
    lead: 'PureAutoLike helps with photos only inside the current Pure Web session when access already exists. It is not an access bypass.',
    chips: ['Pure photo opener', 'Pure hidden photos', 'Pure Web photos', 'accessible photos', 'PureAutoLike photos'],
    sections: [
      ['What it does', 'Adds a convenient page flow for photos available to the active Pure Web session.'],
      ['What it does not do', 'It does not promise access bypass and does not store the Pure authorization header in extension settings.'],
      ['Why together with auto-like', 'Likes, events, accessible photos, and export stay in one small extension.']
    ],
    faq: [
      ['Does it open any photo?', 'No, only photos available to the current session.'],
      ['Is the Pure token stored?', 'No, not in extension settings.'],
      ['Does it work without Pure Web?', 'No, it needs an open Pure Web session.']
    ]
  },
  {
    lang: 'en',
    slug: 'pure-bot-alternative',
    counterpart: 'pure-bot-alternativa',
    title: 'Pure Bot Alternative: Browser Extension for Pure Web | PureAutoLike',
    description: 'PureAutoLike is a Pure bot alternative: a browser extension for Pure Web with auto-like, Telegram notifications, accessible photos, and local export.',
    label: 'Bot alternative',
    h1: 'PureAutoLike: a Pure bot alternative as a browser extension.',
    lead: 'People search for a Pure bot when they often need a focused Pure Web extension. PureAutoLike automates repetitive feed work without pretending to replace conversation.',
    chips: ['Pure bot alternative', 'Pure bot', 'Pure Web automation', 'Pure auto liker', 'Chrome extension for Pure'],
    sections: [
      ['Why not a bot', 'The extension works where Pure Web is already open and does not replace the account or conversation with a separate bot.'],
      ['What it automates', 'Visible likes, accessible photos, Telegram events, timers, and local export.'],
      ['Honest boundary', 'PureAutoLike does not message people for you and does not guarantee replies.']
    ],
    faq: [
      ['Is it a bot?', 'No, it is a browser extension.'],
      ['Does it write messages?', 'No.'],
      ['Why Telegram then?', 'For event alerts, not for replacing conversation.']
    ]
  }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function pageUrl(page) {
  return `${baseUrl}/${page.lang}/queries/${page.slug}/`;
}

function alternatePage(page) {
  const counterpart = pages.find((candidate) => candidate.lang !== page.lang && candidate.slug === page.counterpart);
  return counterpart ? pageUrl(counterpart) : '';
}

function renderPage(page) {
  const url = pageUrl(page);
  const alt = alternatePage(page);
  const isRu = page.lang === 'ru';
  const oppositeLang = isRu ? 'EN' : 'RU';
  const homeLabel = isRu ? 'Главная' : 'Home';
  const installLabel = isRu ? 'Установить' : 'Install';
  const faqLabel = 'FAQ';
  const structuredFaq = page.faq.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer
    }
  }));

  return `<!doctype html>
<html lang="${page.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="${page.lang}" href="${url}">
  ${alt ? `<link rel="alternate" hreflang="${isRu ? 'en' : 'ru'}" href="${alt}">` : ''}
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${baseUrl}/assets/posters/hero-${page.lang}.jpg">
  <link rel="icon" href="../../../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../../styles.css">
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'PureAutoLike',
        applicationCategory: 'BrowserApplication',
        operatingSystem: isRu ? 'Chrome, Chromium, Edge, Brave, Opera, Arc, Яндекс Браузер' : 'Chrome, Chromium, Edge, Brave, Opera, Arc, Yandex Browser',
        description: page.description,
        url,
        downloadUrl: storeUrl,
        dateModified: modified,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: structuredFaq
      }
    ]
  }, null, 2)}
  </script>
</head>
<body class="seo-page article-page">
  <main>
    <header class="site-dock seo-dock" aria-label="${isRu ? 'Навигация сайта' : 'Site navigation'}">
      <a class="brand" href="../../../" aria-label="PureAutoLike home"><span class="brand-mark">P</span><span>PureAutoLike</span></a>
      <nav class="nav-links" aria-label="${isRu ? 'Основная навигация' : 'Primary'}">
        <a href="../../" data-short="${isRu ? 'Г' : 'H'}">${homeLabel}</a>
        <a href="#details" data-short="${isRu ? 'Д' : 'D'}">${isRu ? 'Детали' : 'Details'}</a>
        <a href="#faq" data-short="?">${faqLabel}</a>
      </nav>
      <div class="top-actions">
        <div class="lang-switch" aria-label="${isRu ? 'Язык' : 'Language'}">
          ${alt ? `<a class="lang-button" href="${alt}">${oppositeLang}</a>` : ''}
          <a class="lang-button is-active" href="./">${page.lang.toUpperCase()}</a>
        </div>
        <a class="store-link" href="${storeUrl}">${installLabel}</a>
      </div>
    </header>

    <article class="article-hero">
      <p class="section-label">${escapeHtml(page.label)}</p>
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="article-lead">${escapeHtml(page.lead)}</p>
      <div class="hero-ctas">
        <a class="primary-cta" href="${storeUrl}">${isRu ? 'Установить бесплатно' : 'Install for free'}</a>
        <a class="secondary-cta" href="https://github.com/zgnoff/pureautolike">${isRu ? 'Открыть GitHub' : 'Open GitHub'}</a>
      </div>
    </article>

    <section id="details" class="article-body">
      <div class="intent-strip" aria-label="${isRu ? 'Ключевые запросы' : 'Key search intents'}">
        ${page.chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join('\n        ')}
      </div>
      ${page.sections.map(([heading, body]) => `<h2>${escapeHtml(heading)}</h2>\n      <p>${escapeHtml(body)}</p>`).join('\n\n      ')}
      <h2>${isRu ? 'Что делает PureAutoLike' : 'What PureAutoLike does'}</h2>
      <ul class="article-checklist">
        <li>${isRu ? 'Автолайк видимых анкет в открытой вкладке Pure Web.' : 'Auto-like for visible profiles in an open Pure Web tab.'}</li>
        <li>${isRu ? 'Открытие только доступных фото текущей Pure-сессии.' : 'Opening only photos available to the current Pure session.'}</li>
        <li>${isRu ? 'Опциональные Telegram-уведомления о матчах, лайках и сообщениях.' : 'Optional Telegram alerts for matches, likes, and messages.'}</li>
        <li>${isRu ? 'Локальный Markdown-экспорт видимых описаний при ручном включении.' : 'Local Markdown export of visible descriptions when enabled manually.'}</li>
      </ul>
      <div class="article-links">
        <a href="${isRu ? '../../pure-avtolayk/' : '../../pure-autolike/'}">${isRu ? 'Pure автолайк' : 'Pure autolike'}</a>
        <a href="${isRu ? '../../besplatnyy-avtolayker-pure-2026/' : '../../free-pure-auto-liker-2026/'}">${isRu ? 'Бесплатный 2026' : 'Free 2026'}</a>
        <a href="${isRu ? '../../avtolayker-pure-guide/' : '../../pure-autoclick-vs-autolike/'}">${isRu ? 'Гайд' : 'Comparison guide'}</a>
      </div>
    </section>

    <section id="faq" class="faq-band article-faq">
      <div class="section-head">
        <p class="section-label">FAQ</p>
        <h2>${isRu ? 'Короткие ответы' : 'Short answers'}</h2>
      </div>
      <div class="faq-list">
        ${page.faq.map(([question, answer], index) => `<details${index === 0 ? ' open' : ''}>\n          <summary>${escapeHtml(question)}</summary>\n          <p>${escapeHtml(answer)}</p>\n        </details>`).join('\n        ')}
      </div>
    </section>
  </main>
</body>
</html>
`;
}

for (const page of pages) {
  const dir = new URL(`${page.lang}/queries/${page.slug}/`, siteRoot);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.html', dir), renderPage(page));
}

const urls = pages.map((page) => pageUrl(page));
await writeFile(new URL('seo-cluster-urls.json', new URL('../docs/seo-audit/', import.meta.url)), `${JSON.stringify(urls, null, 2)}\n`);
console.log(`Generated ${pages.length} SEO cluster pages`);
