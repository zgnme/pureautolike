import {mkdir, rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = resolve(root, 'packages');
const targets = {
  chromium: 'pureautolike-chromium.zip',
  firefox: 'pureautolike-firefox.zip',
  safari: 'pureautolike-safari-webextension-source.zip'
};
const requested = process.argv[2] || 'all';
const selected = requested === 'all' ? Object.keys(targets) : [requested];

for (const target of selected) {
  if (!targets[target]) throw new Error(`Unknown package target: ${target}`);
}

run(process.execPath, ['tools/build.mjs', requested], root);
await mkdir(packagesDir, {recursive: true});

for (const target of selected) {
  const zipName = targets[target];
  const zipPath = resolve(packagesDir, zipName);
  await rm(zipPath, {force: true});
  run('zip', ['-qr', zipPath, '.'], resolve(root, 'dist', target));
  console.log(`packaged ${target}: ${zipPath}`);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {cwd, stdio: 'inherit'});
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`);
  }
}
