# PureAutoLike

Lightweight beta browser extension for Pure Web: fast auto-like flow, local
browser control, hidden photo opener, and a remote license check for beta access
and future subscriptions.

<p align="center">
  <a href="README.en.md"><strong>English article</strong></a>
  ·
  <a href="README.ru.md"><strong>Русская статья</strong></a>
  ·
  <a href="INSTALL.md"><strong>Install</strong></a>
  ·
  <a href="PRIVACY.md"><strong>Privacy Policy</strong></a>
  ·
  <a href="SECURITY.md"><strong>Privacy & Security</strong></a>
  ·
  <a href="FEEDBACK.md"><strong>Feedback</strong></a>
</p>

## English

PureAutoLike is a compact WebExtension for people who use Pure in a browser and
do not want to install a separate desktop application. It keeps the product
focused: auto-like visible profiles quickly, avoid repeat clicks during the
session, open hidden Pure photos from the page when the current browser session
has access, and optionally send Telegram alerts for new matches, likes, and
messages. An optional analysis mode can collect visible profile status, age,
and description locally and export them as Markdown for later AI review.

The extension runs inside the browser profile. It includes a lightweight remote
license check for beta access and future subscriptions, but no MCP server,
chat-history analysis layer, SQLite database, or system tray app.
Settings are stored in browser extension storage. Telegram bot settings stay in
that same local extension storage and are sent only from the background script to
Telegram Bot API when the notification feature is enabled. The Pure session token
is read inside the active Pure page bridge at runtime; it is not written to the
repository, extension settings, content script, or background script. Profile
status, age, and descriptions are collected only when the analysis mode is
enabled, have no app-side count cap, and are exported or cleared manually by the
user.

Read the full English product article: [README.en.md](README.en.md)

## Русский

PureAutoLike - легкое расширение для Pure Web. Оно нужно, когда хочется получить
быстрый автолайкер и открытие скрытых фото прямо в браузерном профиле, без
установки отдельного приложения и без лишнего интерфейса.

Расширение работает локально в браузере: кликает лайки, не повторяет уже
обработанные анкеты в рамках текущей сессии и добавляет кнопку открытия фото там,
где Pure показывает скрытое изображение. Также можно включить Telegram-
уведомления о новых матчах, сообщениях и лайках. Есть легкая проверка
beta/license access для будущей подписки, но старого отдельного сервера,
десктопного приложения, MCP-слоя и анализа чатов в этой версии нет. Отдельный
режим сбора статуса, возраста и описаний анкет можно включить вручную и
выгрузить результат в Markdown-файл для анализа нейросетью. Числового лимита на
количество собранных анкет в расширении нет.

Полная русская статья: [README.ru.md](README.ru.md)

## What Is Included

- Chromium build for Chrome, Edge, Yandex Browser, Brave, Opera, Arc, and most
  Chromium browser profiles.
- Firefox-compatible build with DOM-click fallback.
- Safari Web Extension source package for Safari packaging.
- Local-only popup controls.
- Single-runner tab lock: duplicate Pure tabs do not start a second autoliker.
- Duplicate-tab chat history baseline so old Pure messages are not resent to
  Telegram when a tab is cloned or reloaded.
- Optional timers to stop the autoliker or close the current Pure tab after a
  chosen number of minutes.
- Optional Telegram notifications for Pure matches, messages, and likes.
- Optional local Markdown export of collected profile status, age, and descriptions.
- Clear privacy/security notes.

## Regular Browser vs Anti-Detect Profile

PureAutoLike is the same extension in both cases. The difference is the browser
profile that runs it.

| Usage mode | What changes |
| --- | --- |
| Regular Chrome/Chromium browser | Easiest setup for a personal Pure Web session. The extension uses the current browser cookies, current Pure login, local extension storage, and the browser's normal network identity. |
| Anti-detect Chromium profile | Recommended when Pure is already used through a managed browser profile. The extension runs inside that profile and inherits its cookies, proxy, fingerprint, timezone, WebRTC/DNS rules, and other profile-level settings. |

The extension does not replace an anti-detect browser and does not create a
fingerprint or proxy layer by itself. It only automates the Pure tab inside the
browser profile where it is installed.

## Обычный браузер и антидетект-профиль

PureAutoLike устанавливается одинаково, но поведение зависит от профиля браузера.

| Режим | Что меняется |
| --- | --- |
| Обычный Chrome/Chromium | Самый простой вариант для личной веб-сессии Pure. Расширение использует текущие cookies, текущий вход в Pure, локальное хранилище расширения и обычную сетевую идентичность браузера. |
| Антидетект-профиль Chromium | Вариант для тех, кто уже открывает Pure через управляемый профиль. Расширение работает внутри этого профиля и наследует его cookies, proxy, fingerprint, timezone, WebRTC/DNS-правила и другие настройки профиля. |

Расширение не заменяет антидетект-браузер и само не создает fingerprint/proxy
слой. Оно автоматизирует только вкладку Pure внутри того профиля, куда его
установили.

## Install

Public user distribution is planned through the Chrome Web Store beta listing.
GitHub is used for source, feedback, transparency, and maintainer release
artifacts. Packaged builds still contact the PureAutoLike license endpoint, so
future paid access can be enforced by the backend after beta mode is disabled.

Maintainer notes: [INSTALL.md](INSTALL.md)

## Build And Validate

```bash
npm run build
npm run package
npm run validate
npm run audit:clean
```

Generated folders are written to `dist/`.
Release ZIP files are written to `packages/`.

## Repository Shape

This repository intentionally contains the browser extension distribution plus
the lightweight license worker used for beta access and future subscriptions.
The previous desktop app, FastAPI backend, MCP surface, full network monitor,
chat-history analysis, SQLite storage, and system tray behavior are not part of
the current GitHub tree.
