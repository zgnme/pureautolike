# SEO And Indexing Plan

## Current Indexing Status

The repository is currently private. Private GitHub repositories are not suitable
as SEO landing pages because search engines cannot crawl their README, releases,
or package files.

Current public-search check for exact project queries did not surface the
repository. That is expected while the repository remains private.

## What Was Added

- Root README now works as a bilingual product hub.
- Separate English article: `README.en.md`.
- Separate Russian article: `README.ru.md`.
- Public GitHub feedback flow through issue forms.
- Clear documentation for regular-browser use versus anti-detect browser
  profile use.
- Maintainer packaging command keeps release artifacts in sync with validation.
- Privacy/security explanation in `SECURITY.md`.
- Repository package remains extension-only.

## Recommended Public SEO Setup

1. Keep this repository private if the code should stay private.
2. Create a separate public landing page repository or GitHub Pages site.
3. Put the Russian and English articles on public URLs:
   - `/en/pureautolike-extension`
   - `/ru/pureautolike-avtolayker-pure`
4. Add page titles and descriptions:
   - EN title: `PureAutoLike Extension - Fast Local Auto-Liker For Pure Web`
   - EN description: `Lightweight browser extension for Pure Web with fast auto-like flow, local browser control, and hidden photo opener.`
   - RU title: `PureAutoLike - автолайкер и открытие скрытых фото для Pure Web`
   - RU description: `Легкое расширение для Pure Web: быстрый автолайкер, локальная работа в браузере и открытие скрытых фото без отдельного приложения.`
5. Add canonical URLs for each language page.
6. Add `hreflang` links between Russian and English pages.
7. Add Open Graph/Twitter metadata for sharing.
8. Submit the public URLs to Google Search Console and Yandex Webmaster.
9. Link the public landing page from the GitHub repository homepage field.

## Keyword Direction

English:

- Pure auto liker extension
- Pure browser extension
- Pure hidden photo opener
- Pure Web automation
- Chrome extension for Pure

Russian:

- автолайкер Pure
- расширение для Pure
- Pure автолайкер Chrome
- открытие скрытых фото Pure
- автоматизация Pure Web

## Marketing Positioning

Primary message:

> PureAutoLike is a small browser extension for Pure Web that keeps automation in
> the browser: fast likes, duplicate protection, and photo opening without a
> desktop app.

Russian message:

> PureAutoLike - легкое расширение для Pure Web: быстрый автолайкер, защита от
> повторных кликов и открытие скрытых фото без отдельного приложения.

## Store Listing Direction

Chrome Web Store / Firefox Add-ons copy should emphasize:

- lightweight browser extension;
- local browser execution;
- no external analytics backend;
- minimal popup controls;
- transparent permissions.

Avoid overusing words like "anti-detect" in public marketing pages. They can
reduce trust, attract the wrong audience, and create unnecessary review friction
in browser extension stores.

When anti-detect usage is mentioned, frame it as a profile environment boundary:
the extension inherits the browser profile's proxy, fingerprint, cookies, and
network settings, but it does not provide anti-detect functionality itself.
