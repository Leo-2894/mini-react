import { readFile, writeFile, mkdir, rm, readdir, copyFile, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const output = path.resolve(root, 'dist');
// Only this explicit generated directory may be recursively removed.
if (output !== path.join(root, 'dist') || path.dirname(output) !== root) throw Error('Invalid build output');
try { if ((await lstat(output)).isSymbolicLink()) throw Error('Build output must not be a symlink'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log('Build output: ' + output);
await rm(output, { recursive: true, force: true });
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(root, 'tsconfig.json')], { cwd: root, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
const sourceHashes = {};
async function walk(folder) {
  for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) {
    const relative = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(relative);
    else if (entry.isFile()) {
      if (relative.endsWith('.ts')) sourceHashes[relative.replaceAll(path.sep, '/')] = createHash('sha256').update(await readFile(path.join(root, relative))).digest('hex');
      if (/\.(css|html|svg)$/.test(relative)) {
        const target = path.join(output, relative); await mkdir(path.dirname(target), { recursive: true });
        await copyFile(path.join(root, relative), target);
      }
    }
  }
}
await walk('src'); await walk('phase1');
await copyFile(path.join(root, 'index.html'), path.join(output, 'index.html'));
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
await writeFile(path.join(output, 'build-info.json'), JSON.stringify({ typescript: pkg.devDependencies.typescript, sourceHashes }, null, 2));
console.log('Compiled ' + Object.keys(sourceHashes).length + ' TypeScript sources with assets.');
