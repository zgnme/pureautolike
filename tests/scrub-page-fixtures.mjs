import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../site/scrub/index.html', import.meta.url), 'utf8');

assert.match(html, /PUREAUTOLIKE/);
assert.match(html, /FOR PURE WEB/);
assert.match(html, /SYSTEM 01 \/ 2026/);
assert.match(html, /PRESENCE/);
assert.match(html, /AUTOMATED\./);
assert.match(html, /автоматизирует ваше присутствие в Pure Web/);
assert.match(html, /УСТАНОВИТЬ РАСШИРЕНИЕ/);
assert.match(html, /КАК ЭТО РАБОТАЕТ/);
assert.doesNotMatch(html, /Не жми\. Веди\./);
assert.doesNotMatch(html, /is-fallback-video|fallback:/);
assert.match(html, /preload="metadata"/);
assert.match(html, /prefersAppleAlphaVideo/);
assert.match(html, /window\.addEventListener\('pageshow', restoreScrubState\)/);
assert.match(html, /document\.addEventListener\('visibilitychange'/);
assert.match(html, /const editorialTitle = document\.querySelector\('\.editorial-title'\)/);
assert.match(html, /--title-shift/);
assert.doesNotMatch(html, /--wordmark-shift|wordmark-breathe/);
assert.match(html, /MAX_FOLLOW_SPEED_RATIO = 0\.28/);
assert.match(html, /video\.currentTime = smoothTime/);
assert.match(html, /class="poster-frame"/);
assert.match(html, /id="scrubPoster"/);
assert.match(html, /is-video-ready/);

console.log('scrub page fixture validation passed');
