# GitHub Marketing Plan

Last updated: 2026-06-21.

## Goal

Make the public GitHub repository look like a beta-ready product page, not just
an internal source dump. The page should sell the practical workflow:

> Keep Pure open, remove repetitive feed work, and react faster when real events
> arrive.

It must stay honest: PureAutoLike does not promise matches, replies, ranking,
geolocation, moderation status, or account reach.

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

## Generated Visual Assets

### Hero

Path: `docs/assets/pureautolike-github-hero.png`

Prompt used with built-in imagegen:

```text
Use case: ads-marketing
Asset type: GitHub README hero image, wide 16:9 banner
Primary request: Create a premium visual hero for a browser extension named PureAutoLike without rendering any readable text.
Scene/backdrop: a clean macOS-style browser window with a compact extension popup floating above an abstract dating app feed; background uses Pure-inspired hot pink, black, off-white, and subtle checker/wave graphics.
Subject: a sleek light Apple-style WebExtension popup, compact horizontal layout, one large rounded start/stop control, tiny status pill, like-heart symbol, Telegram paper-plane symbol, and soft glass highlights.
Style/medium: polished product marketing render, high-end UI mockup, minimalist Apple-inspired, crisp but not corporate stock.
Composition/framing: wide banner, centered popup on the right third, abstract feed cards on the left, generous whitespace for README title above/below, no phone screen.
Lighting/mood: bright, premium, controlled shadows, soft reflections, clean beta product energy.
Color palette: hot pink #ff0a68, black, white, warm off-white, light gray, small green status accent.
Materials/textures: glossy glass, satin plastic, subtle grain, light depth, rounded corners.
Text (verbatim): none.
Constraints: no readable words, no real people's faces, no nudity, no explicit imagery, no copied Pure logo, no app-store badges, no watermarks.
Avoid: dark oversized dashboard, crowded controls, long vertical popup, fake charts with text, misspelled labels.
```

### Workflow Visual

Path: `docs/assets/pureautolike-workflow-visual.png`

Prompt used with built-in imagegen:

```text
Use case: productivity-visual
Asset type: GitHub README supporting image, wide 16:9 product metric visual
Primary request: Create a premium abstract workflow/impact visual for a Pure Web automation browser extension, without readable text and without making guaranteed match claims.
Scene/backdrop: a clean analytics-style surface showing two simplified paths: manual repetitive tapping represented by many small dim dots, and automated browser workflow represented by a smooth hot-pink line moving through profile cards.
Subject: minimalist chart-like composition with profile-card silhouettes, like-heart icons, a browser extension puzzle-piece motif, and a small Telegram paper-plane notification element.
Style/medium: modern Apple-style product illustration mixed with polished UI dashboard mockup; elegant, high contrast, not playful cartoon.
Composition/framing: wide horizontal banner, compact visual center, breathing room around edges, designed to sit under README feature section.
Lighting/mood: light mode overall with black and hot pink accents, subtle soft shadows, premium SaaS/product feel.
Color palette: white, warm off-white, black, graphite, hot pink #ff0a68, small green status accent.
Materials/textures: matte UI panels, soft glass highlight, faint grain.
Text (verbatim): none.
Constraints: no readable words or numbers, no real faces, no nudity, no explicit dating imagery, no fake guarantees, no copied Pure logo, no watermark.
Avoid: cluttered dashboard, dark cyber style, heavy 3D, long vertical popup, text labels, charts with illegible text.
```

## Follow-Up Visuals Worth Adding Later

- A real popup screenshot from the installed Chrome/Chromium extension after the
  UI is final.
- A Chrome Web Store listing screenshot with the approved store URL.
- A short animated GIF or MP4 showing open Pure tab -> popup toggle -> Telegram
  alert. This should be recorded from the real extension, not generated.
