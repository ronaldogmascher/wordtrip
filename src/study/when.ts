/** Human-friendly time until the next review, in Portuguese ("em 10 min", "em 3 dias"). */
export function timeUntil(due: Date, now: Date): string {
  const minutes = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60000))
  if (minutes < 60) return `em ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `em ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 60) return days === 1 ? 'amanhã' : `em ${days} dias`
  const months = Math.round(days / 30)
  return `em ${months} meses`
}
