# SEO And Indexing Plan

Last checked: 2026-06-24.

PureAutoLike is now a public GitHub repository. GitHub can be indexed, but it is
still a weak landing page compared with a dedicated website because repository
pages have limited metadata control and search snippets are driven mostly by the
README, repository description, topics, release names, and inbound links.

## Current Public Search Status

Manual search checks for exact project queries did not reliably surface the
repository yet:

- `PureAutoLike`
- `PureAutoLike GitHub`
- `site:github.com/zgnme/pureautolike PureAutoLike`

That is normal immediately after a repository becomes public or after history
cleanup. The README and repository metadata should carry the strongest product
copy first, then the URL should be submitted through Google Search Console and
Yandex Webmaster if fast indexing matters.

## Repository Metadata Direction

Recommended public description:

> Beta browser extension for Pure Web: local auto-like flow, hidden photo opener,
> Telegram alerts, and subscription-ready license checks.

Recommended topics:

- `browser-extension`
- `chrome-extension`
- `webextension`
- `pureautolike`
- `pure`
- `dating`
- `automation`
- `telegram-notifications`

Use the published Chrome Web Store URL as the repository homepage:

`https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm`

## README Landing Structure

The root README should work as the product landing page:

1. Hero image with a compact light popup and Pure-inspired visual language.
2. Short one-sentence product promise.
3. CTA links: install/release, feedback, privacy, English/Russian articles.
4. Feature grid focused on real extension behavior.
5. Workflow visual that explains browser-local automation.
6. Privacy/security section that says exactly what is stored and sent.
7. Beta/subscription section that explains free beta access without promising
   permanent free use.
8. Honest limitation note: the extension reduces manual work but does not
   guarantee matches, replies, or account distribution.

## Search Copy Targets

English:

- Pure auto liker extension
- Pure browser extension
- Pure hidden photo opener
- Pure Web automation
- Chrome extension for Pure
- Pure Telegram notifications

Russian:

- автолайкер Pure
- расширение для Pure
- Pure автолайкер Chrome
- открытие скрытых фото Pure
- автоматизация Pure Web
- Telegram уведомления Pure

The copy should be natural and direct. Avoid spammy claims, adult phrasing, and
guaranteed match numbers. A good public promise is:

> Stop babysitting the feed. Keep Pure open, let the repetitive likes run, and
> react faster when matches or messages arrive.

## Visual Assets

Current GitHub assets:

- `docs/assets/pureautolike-github-hero.png`: rendered hero for the README.
- `docs/assets/pureautolike-workflow-visual.png`: rendered workflow visual for
  the feature section.
- `docs/assets/pureautolike-popup-real-render.png`: English real popup render
  used inside the marketing compositions.
- `store-assets/pureautolike-store-screenshot-1280x800.png`: Chrome Web Store
  style screenshot/mockup.
- `store-assets/pureautolike-store-icon-128.png`: store icon.
- Published Chrome Web Store listing:
  `https://chromewebstore.google.com/detail/pureautolike/abamkpcdpihjpaomdpaklhifpfbobgmm`.

Current README visuals are rendered from deterministic HTML/CSS sources under
`docs/assets-src/`, with the real popup render embedded as the central product
surface. Product claims, limitations, and CTAs should remain as real README text.

## Publishing Checklist

- Keep release assets aligned with `package.json` version.
- Keep old release tags deleted unless they are intentionally restored.
- Run `npm run validate` and `npm run audit:clean` before publishing.
- Scan for tokens, local paths, personal contact details, and real infrastructure
  ids before each public push.
- Keep production Cloudflare ids and secrets out of tracked files. Store them in
  Cloudflare settings, secrets, or local untracked config.
- Use a dedicated support email later if Chrome Web Store requires one; do not
  publish a personal email in repository docs by default.
