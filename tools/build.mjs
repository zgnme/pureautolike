import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const targets = ['chromium', 'firefox', 'safari'];
const requested = process.argv[2] || 'all';
const selected = requested === 'all' ? targets : [requested];

const sharedPaths = [
  'popup.html',
  'INSTALL.md',
  'README.md',
  'README.en.md',
  'README.ru.md',
  'SECURITY.md',
  'src/background.js',
  'src/content.css',
  'src/content.js',
  'src/icons',
  'src/page-bridge.js',
  'src/popup.css',
  'src/popup.js',
  'src/pure-preview-card.png'
];

for (const target of selected) {
  if (!targets.includes(target)) {
    throw new Error(`Unknown target: ${target}`);
  }
}

await mkdir(dist, {recursive: true});

for (const target of selected) {
  const out = resolve(dist, target);
  await rm(out, {recursive: true, force: true});
  await mkdir(resolve(out, 'src'), {recursive: true});
  for (const path of sharedPaths) {
    await cp(resolve(root, path), resolve(out, path), {recursive: true});
  }
  const manifest = await readFile(resolve(root, 'manifests', `${target}.json`), 'utf8');
  await writeFile(resolve(out, 'manifest.json'), manifest);
  await writeFile(resolve(out, 'TARGET.md'), targetReadme(target));
  console.log(`built ${target}: ${out}`);
}

function targetReadme(target) {
  if (target === 'chromium') {
    return [
      '# PureAutoLike Chromium Build',
      '',
      'Use this directory with Chrome, Edge, Brave, Opera, Arc, or another Chromium browser.',
      'This build includes the `debugger` permission so CDP-level mouse clicks are available.',
      ''
    ].join('\n');
  }
  if (target === 'firefox') {
    return [
      '# PureAutoLike Firefox Build',
      '',
      'Use this directory with Firefox-compatible WebExtensions.',
      'This build does not request `debugger`; it falls back to DOM-level clicks.',
      ''
    ].join('\n');
  }
  return [
    '# PureAutoLike Safari Build',
    '',
    'Use this directory as Safari Web Extension source for Xcode or App Store Connect packaging.',
    'Safari does not get the Chromium CDP/debugger click mode; it uses DOM fallback clicks.',
    ''
  ].join('\n');
}
