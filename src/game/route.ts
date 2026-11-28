import { cities } from '../content/index.ts'
import type { City } from '../content/types.ts'

// The route with the traveler's own starting point: phase 1 is wherever they leave from
// (chosen in the first-launch setup); from there the trip follows São Paulo, Rio and so on.

export const DEFAULT_HOME = 'Sua cidade'

export function routeCities(homeCity?: string): City[] {
  const name = homeCity?.trim() || DEFAULT_HOME
  return cities.map((c, i) => (i === 0 ? { ...c, name, region: '' } : c))
}
