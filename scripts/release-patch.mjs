import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

const pkg = readJSON('package.json');
const parts = String(pkg.version || '0.0.0').split('.').map(Number);
if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
  throw new Error(`Version invalide dans package.json: ${pkg.version}`);
}

parts[2] += 1;
const version = parts.join('.');
pkg.version = version;
writeJSON('package.json', pkg);

if (fs.existsSync('package-lock.json')) {
  const lock = readJSON('package-lock.json');
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  writeJSON('package-lock.json', lock);
}

const git = (...args) => execFileSync('git', args, { stdio: 'inherit' });

git('add', '-A');
try {
  git('diff', '--cached', '--quiet');
  console.log('Aucun changement à commit.');
  process.exit(0);
} catch {
  // git diff --quiet returns 1 when staged changes exist.
}

git('commit', '-m', `v${version}`);
git('push');
console.log(`Push terminé: v${version}`);
