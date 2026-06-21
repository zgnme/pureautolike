import {readdir, readFile, stat} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirs = new Set(['.git', '.kopai', '.wrangler', 'node_modules', 'dist', 'analysis']);
const ignoredExtensions = new Set(['.zip', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']);
const allowedSecretWords = new Set([
  'src/content.js',
  'src/page-bridge.js',
  'SECURITY.md',
  'tests/audit-clean.mjs'
]);

function hasLocalDeveloperPath(source) {
  return source.includes('/Users/') || source.includes('\\Users\\');
}

const checks = [
  {name: 'local developer path', test: hasLocalDeveloperPath},
  {name: 'GitHub token', pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/},
  {name: 'OpenAI-style key', pattern: /sk-[A-Za-z0-9_-]{20,}/},
  {name: 'private key block', pattern: /BEGIN (RSA |OPENSSH |EC |DSA |PRIVATE )?PRIVATE KEY/},
  {name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/},
  {name: 'generic api key assignment', pattern: /(api[_-]?key|client[_-]?secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/i},
  {name: 'committed bearer token', pattern: /Bearer\s+[A-Za-z0-9._~+/-]{20,}/}
];

async function walk(dir, out = []) {
  for (const entry of await readdir(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const abs = join(dir, entry);
    const info = await stat(abs);
    if (info.isDirectory()) {
      await walk(abs, out);
      continue;
    }
    const rel = relative(root, abs);
    const ext = rel.slice(rel.lastIndexOf('.'));
    if (ignoredExtensions.has(ext)) continue;
    out.push(rel);
  }
  return out;
}

const failures = [];
for (const file of await walk(root)) {
  const source = await readFile(join(root, file), 'utf8');
  for (const check of checks) {
    const matched = check.test ? check.test(source) : check.pattern.test(source);
    if (!matched) continue;
    if (check.name === 'local developer path' && file === 'tests/audit-clean.mjs') continue;
    if (check.name === 'committed bearer token' && allowedSecretWords.has(file)) continue;
    failures.push(`${file}: ${check.name}`);
  }
}

if (failures.length) {
  throw new Error(`cleanliness audit failed:\n${failures.join('\n')}`);
}

console.log('cleanliness audit passed');
