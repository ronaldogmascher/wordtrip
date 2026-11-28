import type { WordTripDB } from './db.ts'

// "Seguro do motorhome": the whole progress saved to a JSON file and loaded back later.
// Dates are written as {"$date": "<ISO>"} so they come back as real dates.

export const BACKUP_APP = 'wordtrip'
export const BACKUP_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: Date
  tables: Record<string, unknown[]>
}

export function encodeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, function (this: Record<string, unknown>, key, value) {
    const raw = this[key]
    return raw instanceof Date ? { $date: raw.toISOString() } : value
  })
}

export function decodeBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text, (_key, value) =>
      value && typeof value === 'object' && typeof value.$date === 'string' && Object.keys(value).length === 1 ? new Date(value.$date) : value,
    )
  } catch {
    throw new Error('O arquivo não é um seguro do WordTrip válido.')
  }
  const file = data as Partial<BackupFile>
  if (!file || file.app !== BACKUP_APP || typeof file.tables !== 'object' || file.tables === null) {
    throw new Error('O arquivo não é um seguro do WordTrip válido.')
  }
  if ((file.version ?? 0) > BACKUP_VERSION) {
    throw new Error('Este seguro foi feito por uma versão mais nova do app. Atualize o WordTrip e tente de novo.')
  }
  return file as BackupFile
}

/** Everything in the database, ready to be written to a file. */
export async function createBackup(db: WordTripDB, now = new Date()): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {}
  for (const table of db.tables) tables[table.name] = await table.toArray()
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now, tables }
}

/** Replaces everything in the database with the backup's contents. Unknown tables are ignored. */
export async function restoreBackup(db: WordTripDB, backup: BackupFile): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
      const rows = backup.tables[table.name]
      if (Array.isArray(rows) && rows.length) await table.bulkPut(rows)
    }
    // The restored file counts as the latest backup, so the reminder does not fire right away.
    const settings = await db.settings.get('app')
    if (settings) await db.settings.put({ ...settings, lastBackupAt: backup.exportedAt })
  })
}

export const backupFileName = (now: Date) =>
  `wordtrip-seguro-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`

/** True when the reminder is on and the last backup (or the trip's start) is older than the interval. */
export function backupDue(reminderDays: number, lastBackupAt: Date | undefined, tripStart: Date | undefined, now: Date): boolean {
  if (!reminderDays) return false
  const since = lastBackupAt ?? tripStart
  if (!since) return false
  return now.getTime() - since.getTime() >= reminderDays * 86_400_000
}
