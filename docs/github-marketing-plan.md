# GitHub Marketing Plan

Last updated: 2026-06-21.

## Goal

Make the public GitHub repository look like a beta-ready product page, not just
an internal source dump. The page should sell the practical workflow:

> Keep Pure open, remove repetitive feed work, and react faster when real events
> arrive.

The visual rule is strict: do not show fake extension UI. Marketing graphics can
add Pure/Apple-style framing, callouts, shadows, badges, and background shapes,
but the central extension interface must be a real render from repository
sources.

## Audience

Primary reader:

- already uses Pure Web;
- wants less manual feed work;
- wants a small browser extension instead of a desktop app;
- cares that Telegram tokens and profile notes stay local unless a feature needs
  to send them.

Public language should be direct and high-intent, but not crude. Avoid adult
slang, fake outcome claims, and guaranteed match numbers.

## Implemented Page Structure

1. Hero banner: `docs/assets/pureautolike-github-hero.png`.
2. One-sentence product promise.
3. CTA links: English, Russian, install, privacy, security, feedback.
4. Trust badges: free beta, WebExtension, local settings, no analytics.
5. Feature table with actual extension behavior.
6. Workflow visual: `docs/assets/pureautolike-workflow-visual.png`.
7. Mermaid architecture diagram for exact technical flow.
8. Privacy and beta/subscription sections.
9. Limitation note to avoid misleading marketing claims.

## Rendered Visual Assets

The current assets are rendered with Playwright from deterministic HTML/CSS
sources. They are not AI-generated UI mockups.

### Real Popup Baseline

Output:

- `docs/assets/pureautolike-popup-real-render.png`

Source:

- `docs/assets-src/popup-real-render-en.html`

This file mirrors the popup structure and uses the same extension CSS and icon
assets, but fixes the marketing screenshot language to English. It does not load
`src/popup.js`, so the render is stable and does not depend on browser extension
APIs or stored local settings.

Render command:

```bash
npx --yes playwright screenshot \
  --viewport-size="760,270" \
  --wait-for-timeout=500 \
  "file://$PWD/docs/assets-src/popup-real-render-en.html" \
  docs/assets/pureautolike-popup-real-render.png
```

### Hero

Output:

- `docs/assets/pureautolike-github-hero.png`

Source:

- `docs/assets-src/github-hero-real.html`

Purpose: first-screen GitHub visual. It uses the real popup baseline inside a
browser-like frame with controlled Pure/Apple-style marketing elements.

Render command:

```bash
npx --yes playwright screenshot \
  --viewport-size="1600,900" \
  --wait-for-timeout=500 \
  "file://$PWD/docs/assets-src/github-hero-real.html" \
  docs/assets/pureautolike-github-hero.png
```

### Workflow Visual

Output:

- `docs/assets/pureautolike-workflow-visual.png`

Source:

- `docs/assets-src/github-workflow-real.html`

Purpose: feature-section visual that explains the product without fake metrics
or guaranteed match claims.

Render command:

```bash
npx --yes playwright screenshot \
  --viewport-size="1600,900" \
  --wait-for-timeout=500 \
  "file://$PWD/docs/assets-src/github-workflow-real.html" \
  docs/assets/pureautolike-workflow-visual.png
```

## Follow-Up Visuals Worth Adding Later

- A real Chrome Web Store screenshot after the listing is approved.
- A short animated GIF or MP4 showing open Pure tab -> popup toggle -> Telegram
  alert. This should be recorded from the real extension, not generated.
- A localized Russian marketing image set, if the GitHub README later becomes
  Russian-first again.
