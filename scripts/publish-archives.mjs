import fs from 'node:fs'
import path from 'node:path'

export function publishArchives(staging, output, name, archives) {
  fs.mkdirSync(output, { recursive: true })
  // Copy all archives onto the destination filesystem before touching releases.
  const pending = fs.mkdtempSync(path.join(output, '.pending-'))
  const backups = []
  const installed = []
  let preserveBackup = false
  try {
    for (const archive of archives) {
      fs.cpSync(path.join(staging, archive), path.join(pending, archive))
    }
    const backup = path.join(pending, 'backup')
    fs.mkdirSync(backup)
    try {
      for (const archive of archives) {
        const destination = path.join(output, archive)
        if (fs.existsSync(destination)) {
          fs.renameSync(destination, path.join(backup, archive))
          backups.push(archive)
        }
        fs.renameSync(path.join(pending, archive), destination)
        installed.push(archive)
      }
    } catch (error) {
      // Restore every file when installing an archive fails.
      try {
        for (const archive of installed) fs.rmSync(path.join(output, archive))
        for (const archive of backups)
          fs.renameSync(path.join(backup, archive), path.join(output, archive))
      } catch (rollbackError) {
        preserveBackup = true
        throw new AggregateError(
          [error, rollbackError],
          `Release recovery failed; backups remain in ${backup}`,
          { cause: rollbackError },
        )
      }
      throw error
    }
    // Only retire older versions after all new archives are in place.
    for (const entry of fs.readdirSync(output, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        entry.name.startsWith(`${name}-`) &&
        entry.name.endsWith('.zip') &&
        !archives.includes(entry.name)
      ) {
        fs.rmSync(path.join(output, entry.name))
      }
    }
  } finally {
    if (!preserveBackup) fs.rmSync(pending, { recursive: true, force: true })
  }
}
