import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const requested = process.argv.slice(2)
const targets = requested.length ? requested : ['chromium', 'firefox']
if (targets.some((target) => !['chromium', 'firefox'].includes(target))) {
  throw new Error('Build target must be chromium or firefox.')
}
const check = spawnSync(
  process.execPath,
  [
    fileURLToPath(
      new URL('../node_modules/typescript/bin/tsc', import.meta.url),
    ),
    '--noEmit',
  ],
  { cwd: root, stdio: 'inherit' },
)
if (check.error) throw check.error
if (check.status !== 0) process.exit(check.status ?? 1)

// A full build removes the old universal package at dist/ as well, so loading
// dist/ cannot accidentally install an obsolete manifest with mixed settings.
if (!requested.length)
  rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true })
for (const mode of targets) await build({ root, mode })
