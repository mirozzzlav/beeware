import { spawnSync } from 'node:child_process'
import { publishArchives } from './publish-archives.mjs'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const { name, version } = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8'),
)
const output = path.join(root, 'releases')
const basename = `${name}-${version}`
const archives = [`${basename}.zip`, `${basename}-source.zip`]
const sourceEntries = [
  'README.md',
  'package.json',
  'package-lock.json',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc.json',
  'manifest.template.json',
  'design-tokens.plugin.ts',
  'vite.config.ts',
  'tsconfig.json',
  'eslint.config.js',
  'index.html',
  'settings.html',
  'src',
  'scripts',
  'tests',
]

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.status ?? result.signal}).`)
  }
}

function packageRelease() {
  if (Number(process.versions.node.split('.')[0]) !== 24) {
    throw new Error('Use Node.js 24, as specified in .nvmrc.')
  }
  if (
    !/^[a-z0-9][a-z0-9._-]*$/.test(name) ||
    !/^\d+\.\d+\.\d+(?:-[\da-z.-]+)?(?:\+[\da-z.-]+)?$/i.test(version)
  ) {
    throw new Error('Invalid package name or version for release filenames.')
  }
  const zip = spawnSync('zip', ['-v'], { stdio: 'ignore' })
  if (zip.error || zip.status !== 0) {
    throw new Error('Install the zip command before running npm run package.')
  }
  for (const entry of sourceEntries) {
    if (!existsSync(path.join(root, entry))) {
      throw new Error(`Required source entry is missing: ${entry}`)
    }
  }

  // Build with the same Node.js and npm that launched this script.
  if (process.env.npm_execpath) {
    run(process.execPath, [process.env.npm_execpath, 'run', 'build'])
  } else {
    run('npm', ['run', 'build'])
  }
  const manifest = JSON.parse(
    readFileSync(path.join(root, 'dist/manifest.json'), 'utf8'),
  )
  if (manifest.version !== version) {
    throw new Error('The built manifest version does not match package.json.')
  }

  const staging = mkdtempSync(path.join(tmpdir(), `${name}-release-`))
  try {
    const source = path.join(staging, 'source')
    mkdirSync(source)
    const optionalEntries = readdirSync(root).filter(
      (entry) =>
        entry === 'public' ||
        /^(?:LICENSE|COPYING|NOTICE)(?:\..*)?$/i.test(entry),
    )
    for (const entry of [...sourceEntries, ...optionalEntries]) {
      cpSync(path.join(root, entry), path.join(source, entry), {
        recursive: true,
        dereference: true,
        filter: (file) => {
          const filename = path.basename(file)
          return (
            !['node_modules', 'dist', 'releases', '.git', '.idea'].includes(
              filename,
            ) &&
            !/^\.env(?:\.|$)/.test(filename) &&
            !/\.(?:zip|xpi|log|tsbuildinfo)$/i.test(filename)
          )
        },
      })
    }
    run(
      'zip',
      ['-q', '-X', '-r', path.join(staging, archives[0]), '.'],
      path.join(root, 'dist'),
    )
    run('zip', ['-q', '-X', '-r', path.join(staging, archives[1]), '.'], source)

    publishArchives(staging, output, name, archives)
    for (const archive of archives)
      console.log(`Created ${path.join(output, archive)}`)
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

try {
  packageRelease()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
