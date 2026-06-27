const STORE_URL = 'https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm';
const SITE_URL = 'https://zgnoff.github.io/pureautolike/';
const LANGUAGE_STORAGE_KEY = 'pureautolike.site.language';
document.documentElement.classList.add('js');

const locales = {
  ru: {
    title: 'PureAutoLike - автолайкер Pure для Pure Web',
    description: 'PureAutoLike - beta Chrome-расширение для Pure Web: автолайкер Pure, открытие доступных фото, Telegram-уведомления, таймеры и локальный Markdown-экспорт.',
    video: 'assets/videos/hero-ru.mp4',
    poster: 'assets/posters/hero-ru.jpg',
    shareImage: `${SITE_URL}assets/posters/hero-ru.jpg`,
    navFeatures: 'Функции',
    navTrust: 'Границы',
    navFaq: 'FAQ',
    installShort: 'Install',
    heroKicker: 'Beta для Pure Web',
    heroTitle: 'PureAutoLike',
    installCta: 'Установить',
    githubCta: 'GitHub',
    featuresLabel: 'Функции',
    featuresTitle: 'Четыре функции. Без лишней панели.',
    featureLikeTitle: 'Автолайк',
    featureLikeCopy: 'Видимые карточки',
    featurePhotoTitle: 'Фото',
    featurePhotoCopy: 'Доступ текущей сессии',
    featureTelegramTitle: 'Telegram',
    featureTelegramCopy: 'Матчи, лайки, сообщения',
    featureExportTitle: 'Markdown',
    featureExportCopy: 'Локальный экспорт',
    scenarioLabel: 'Сценарии',
    scenarioTitle: 'Что реально делает расширение.',
    scenarioTabAutolike: 'Автолайк',
    scenarioTabPhotos: 'Фото',
    scenarioTabTelegram: 'Telegram',
    scenarioTabTimers: 'Таймеры',
    scenarioTabExport: 'Markdown',
    seoLabel: 'Поисковые запросы',
    seoTitle: 'Pure автолайкер для Pure Web, без отдельного приложения.',
    seoIntro: 'PureAutoLike нужен тем, кто ищет расширение для Pure, Pure auto liker, автолайкер Pure Chrome, открытие скрытых фото Pure и Telegram-уведомления по событиям в Pure Web.',
    seoAutoTitle: 'Auto liker',
    seoAutoCopy: 'Автолайк работает внутри открытой вкладки Pure Web и кликает видимые лайки без отдельного desktop-бота.',
    seoChromeTitle: 'Chrome extension',
    seoChromeCopy: 'Основной публичный канал установки - Chrome Web Store; код, политика приватности и обратная связь остаются на GitHub.',
    seoPureTitle: 'Pure Web automation',
    seoPureCopy: 'Расширение покрывает практичные действия: лайки, доступные фото, Telegram-события, таймеры и локальный Markdown-экспорт.',
    trustLabel: 'Границы',
    trustTitle: 'Без скрытых обещаний.',
    trustOne: 'Настройки и экспорт хранятся локально.',
    trustTwo: 'Telegram включается только вручную.',
    trustThree: 'PureAutoLike не меняет матчи, геопозицию или модерацию.',
    faqTitle: 'Коротко перед установкой.',
    faqChromeQ: 'Где устанавливать?',
    faqChromeA: 'Основной путь - Chrome Web Store. GitHub остается для кода, политики приватности, issue и обратной связи.',
    faqLocalQ: 'Это работает в фоне?',
    faqLocalA: 'Автолайк работает только в открытой вкладке Pure Web. Фоновая часть держит состояние, таймеры, Telegram и beta-проверку.',
    faqGuaranteeQ: 'Это гарантирует матчи?',
    faqGuaranteeA: 'Нет. Расширение убирает ручную рутину, но не управляет ранжированием, ответами или модерацией Pure.',
    faqBetaQ: 'Что с beta и подпиской?',
    faqBetaA: 'Сейчас beta бесплатная. Проверка лицензии уже есть, чтобы позже включить платный доступ через тот же канал установки.',
    finalTitle: 'Проверь beta на своей вкладке Pure.',
    finalCta: 'Установить PureAutoLike',
    scenarios: {
      autolike: {
        eyebrow: 'Открытая вкладка Pure',
        title: 'Автолайк',
        pointOne: 'Кликает видимые лайки.',
        pointTwo: 'Не повторяет уже обработанные карточки.',
        pointThree: 'Работает в открытой вкладке Pure.',
        note: 'Не меняет выдачу и геопозицию.'
      },
      photos: {
        eyebrow: 'Доступ текущей сессии',
        title: 'Фото',
        pointOne: 'Открывает только доступные фото.',
        pointTwo: 'Использует текущую Pure-сессию.',
        pointThree: 'Не хранит Pure authorization header.',
        note: 'Если доступа нет, обхода нет.'
      },
      telegram: {
        eyebrow: 'Включается вручную',
        title: 'Telegram',
        pointOne: 'Token и chat id вводишь сам.',
        pointTwo: 'События: матчи, лайки, сообщения.',
        pointThree: 'Есть cooldown от повторов.',
        note: 'По умолчанию выключен.'
      },
      timers: {
        eyebrow: 'Контроль сессии',
        title: 'Таймеры',
        pointOne: 'Остановить автолайк.',
        pointTwo: 'Закрыть вкладку Pure.',
        pointThree: 'Работает через browser alarms.',
        note: 'Не запускает Pure сам.'
      },
      export: {
        eyebrow: 'Локально',
        title: 'Markdown',
        pointOne: 'Сохраняет видимые описания.',
        pointTwo: 'Хранит записи локально.',
        pointThree: 'Экспорт запускается вручную.',
        note: 'По умолчанию выключен.'
      }
    }
  },
  en: {
    title: 'PureAutoLike - Auto liker extension for Pure Web',
    description: 'PureAutoLike is a beta Chrome extension for Pure Web: Pure auto liker, accessible photo opener, Telegram alerts, timers, and local Markdown export.',
    video: 'assets/videos/hero-en.mp4',
    poster: 'assets/posters/hero-en.jpg',
    shareImage: `${SITE_URL}assets/posters/hero-en.jpg`,
    navFeatures: 'Features',
    navTrust: 'Boundaries',
    navFaq: 'FAQ',
    installShort: 'Install',
    heroKicker: 'Beta for Pure Web',
    heroTitle: 'PureAutoLike',
    installCta: 'Install',
    githubCta: 'GitHub',
    featuresLabel: 'Features',
    featuresTitle: 'Four functions. No extra control panel.',
    featureLikeTitle: 'Auto-like',
    featureLikeCopy: 'Visible cards',
    featurePhotoTitle: 'Photos',
    featurePhotoCopy: 'Current-session access',
    featureTelegramTitle: 'Telegram',
    featureTelegramCopy: 'Matches, likes, messages',
    featureExportTitle: 'Markdown',
    featureExportCopy: 'Local export',
    scenarioLabel: 'Scenarios',
    scenarioTitle: 'What the extension actually does.',
    scenarioTabAutolike: 'Auto-like',
    scenarioTabPhotos: 'Photos',
    scenarioTabTelegram: 'Telegram',
    scenarioTabTimers: 'Timers',
    scenarioTabExport: 'Markdown',
    seoLabel: 'Search queries',
    seoTitle: 'Pure auto liker for Pure Web, without a desktop app.',
    seoIntro: 'PureAutoLike is for people searching for a Pure extension, Pure auto liker, Pure app auto like, Pure hidden photo opener, and Telegram notifications for Pure Web events.',
    seoAutoTitle: 'Auto liker',
    seoAutoCopy: 'Auto-like runs inside the open Pure Web tab and clicks visible likes without a separate desktop bot.',
    seoChromeTitle: 'Chrome extension',
    seoChromeCopy: 'Chrome Web Store is the main public install channel; source, privacy policy, and feedback stay available on GitHub.',
    seoPureTitle: 'Pure Web automation',
    seoPureCopy: 'The extension covers practical actions: likes, accessible photos, Telegram events, timers, and local Markdown export.',
    trustLabel: 'Boundaries',
    trustTitle: 'No hidden promises.',
    trustOne: 'Settings and exports stay local.',
    trustTwo: 'Telegram is enabled manually.',
    trustThree: 'PureAutoLike does not change matches, location, or moderation.',
    faqTitle: 'Short answers before install.',
    faqChromeQ: 'Where do I install it?',
    faqChromeA: 'Chrome Web Store is the main install path. GitHub stays available for source, privacy policy, issues, and feedback.',
    faqLocalQ: 'Does it work in the background?',
    faqLocalA: 'Auto-like works only in an open Pure Web tab. The background worker keeps state, timers, Telegram, and beta checks.',
    faqGuaranteeQ: 'Does it guarantee matches?',
    faqGuaranteeA: 'No. It removes repetitive feed work, but it does not control Pure ranking, replies, or moderation.',
    faqBetaQ: 'What about beta and subscription?',
    faqBetaA: 'Beta is free now. The license check is already in place so paid access can later use the same install channel.',
    finalTitle: 'Test the beta on your own Pure tab.',
    finalCta: 'Install PureAutoLike',
    scenarios: {
      autolike: {
        eyebrow: 'Open Pure tab',
        title: 'Auto-like',
        pointOne: 'Clicks visible likes.',
        pointTwo: 'Skips processed cards.',
        pointThree: 'Runs in the open Pure tab.',
        note: 'It does not change ranking or location.'
      },
      photos: {
        eyebrow: 'Current-session access',
        title: 'Photos',
        pointOne: 'Opens accessible photos only.',
        pointTwo: 'Uses the current Pure session.',
        pointThree: 'Does not store the Pure auth header.',
        note: 'No access means no bypass.'
      },
      telegram: {
        eyebrow: 'Manual opt-in',
        title: 'Telegram',
        pointOne: 'You enter token and chat id.',
        pointTwo: 'Events: matches, likes, messages.',
        pointThree: 'Cooldown reduces duplicates.',
        note: 'Off by default.'
      },
      timers: {
        eyebrow: 'Session control',
        title: 'Timers',
        pointOne: 'Stop auto-like.',
        pointTwo: 'Close the Pure tab.',
        pointThree: 'Uses browser alarms.',
        note: 'Does not open Pure by itself.'
      },
      export: {
        eyebrow: 'Local',
        title: 'Markdown',
        pointOne: 'Stores visible descriptions.',
        pointTwo: 'Keeps records local.',
        pointThree: 'Export is manual.',
        note: 'Off by default.'
      }
    }
  }
};

const video = document.getElementById('heroVideo');
const buttons = Array.from(document.querySelectorAll('.lang-button'));
const i18nNodes = Array.from(document.querySelectorAll('[data-i18n]'));
const scenarioTabs = Array.from(document.querySelectorAll('.scenario-tab'));
const scenarioFields = Array.from(document.querySelectorAll('[data-scenario-field]'));
const scenarioCard = document.querySelector('.scenario-card');
let activeScenario = 'autolike';
let currentLanguage = 'ru';

for (const link of document.querySelectorAll('a[href="#store"]')) {
  link.href = STORE_URL;
}

function setLanguage(lang) {
  currentLanguage = locales[lang] ? lang : 'ru';
  const data = locales[currentLanguage];
  document.documentElement.lang = currentLanguage;
  document.title = data.title;

  const description = document.querySelector('meta[name="description"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const canonical = document.querySelector('link[rel="canonical"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (description) description.setAttribute('content', data.description);
  if (ogDescription) ogDescription.setAttribute('content', data.description);
  if (twitterDescription) twitterDescription.setAttribute('content', data.description);
  if (ogImage) ogImage.setAttribute('content', data.shareImage);
  if (twitterImage) twitterImage.setAttribute('content', data.shareImage);
  if (ogUrl) ogUrl.setAttribute('content', SITE_URL);
  if (canonical) canonical.setAttribute('href', SITE_URL);

  for (const node of i18nNodes) {
    const value = data[node.dataset.i18n];
    if (value) node.textContent = value;
  }

  for (const button of buttons) {
    button.classList.toggle('is-active', button.dataset.lang === currentLanguage);
  }

  updateScenario();
  updateVideo(data);
}

function updateVideo(data) {
  if (!video || video.dataset.lang === currentLanguage) return;
  video.dataset.lang = currentLanguage;
  video.poster = data.poster;
  const source = video.querySelector('source');
  if (source) source.src = data.video;
  video.load();
  video.play().catch(() => {});
}

function updateScenario() {
  const data = locales[currentLanguage] || locales.ru;
  const scenario = data.scenarios[activeScenario] || data.scenarios.autolike;

  for (const tab of scenarioTabs) {
    const isActive = tab.dataset.scenario === activeScenario;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }

  for (const node of scenarioFields) {
    const value = scenario[node.dataset.scenarioField];
    if (value) node.textContent = value;
  }

  if (scenarioCard) {
    scenarioCard.classList.remove('is-switching');
    void scenarioCard.offsetWidth;
    scenarioCard.classList.add('is-switching');
  }
}

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return locales[stored] ? stored : null;
  } catch {
    return null;
  }
}

function detectBrowserLanguage() {
  const browserLanguages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || navigator.userLanguage || ''];

  return browserLanguages.some((language) => String(language).toLowerCase().startsWith('ru'))
    ? 'ru'
    : 'en';
}

function saveLanguage(lang) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Language switching should keep working even when storage is blocked.
  }
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    const lang = button.dataset.lang;
    saveLanguage(lang);
    setLanguage(lang);
  });
}

for (const tab of scenarioTabs) {
  tab.addEventListener('click', () => {
    activeScenario = tab.dataset.scenario || 'autolike';
    updateScenario();
  });
}

function setupReveal() {
  const revealNodes = Array.from(document.querySelectorAll('.reveal'));
  if (!revealNodes.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    for (const node of revealNodes) node.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.14
  });

  for (const node of revealNodes) observer.observe(node);
}

setLanguage(getStoredLanguage() || detectBrowserLanguage());
setupReveal();
