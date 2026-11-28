import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { backupDue, createBackup, decodeBackup, encodeBackup, restoreBackup } from './backup.ts'
import { WordTripDB } from './db.ts'

const now = new Date('2026-11-28T12:00:00Z')

describe('backup', () => {
  it('saves and restores everything, dates included', async () => {
    const source = new WordTripDB('backup-source')
    await source.profile.put({ id: 'me', name: 'R', character: 'male', pet: 'cat', petName: 'Mimi', motorhomeName: 'Pé na Estrada', language: 'en', createdAt: now })
    await source.bossAttempts.add({ phaseId: 'en:a1:01', at: now, correct: 18, total: 20, passed: true })
    await source.rewards.put({ phaseId: 'en:a1:01', text: 'Um açaí', claimedAt: now })
    const text = encodeBackup(await createBackup(source, now))

    const target = new WordTripDB('backup-target')
    await target.rewards.put({ phaseId: 'old', text: 'apagar' })
    await target.settings.put({ id: 'app', newPerDay: 15, dailyGoalMinutes: 15, accent: 'US', pomodoro: { studyMinutes: 15, breakMinutes: 4, longBreakMinutes: 10, cyclesBeforeLongBreak: 4 }, uiLanguage: 'pt', recoveryActive: false, soundEffects: true, backupReminderDays: 7 })
    await restoreBackup(target, decodeBackup(text))

    const profile = await target.profile.get('me')
    expect(profile?.petName).toBe('Mimi')
    expect(profile?.createdAt).toBeInstanceOf(Date)
    expect((await target.bossAttempts.toArray())[0].at.getTime()).toBe(now.getTime())
    expect(await target.rewards.get('old')).toBeUndefined()
    expect(await target.rewards.get('en:a1:01')).toBeTruthy()
  })
  it('refuses files that are not WordTrip backups', () => {
    expect(() => decodeBackup('not json')).toThrow()
    expect(() => decodeBackup('{"app":"other","tables":{}}')).toThrow()
    expect(() => decodeBackup('{"app":"wordtrip","version":99,"tables":{}}')).toThrow(/versão mais nova/)
  })
  it('reminds when the last backup is older than the interval', () => {
    const eightDaysAgo = new Date(now.getTime() - 8 * 86_400_000)
    expect(backupDue(7, eightDaysAgo, undefined, now)).toBe(true)
    expect(backupDue(7, now, eightDaysAgo, now)).toBe(false)
    expect(backupDue(7, undefined, eightDaysAgo, now)).toBe(true)
    expect(backupDue(0, eightDaysAgo, undefined, now)).toBe(false)
  })
})
