import { citiesA1 } from './en/journey.ts'
import { phase01 } from './en/phases/01-santo-andre.ts'
import { phase02 } from './en/phases/02-sao-paulo.ts'
import type { Phase, Sense } from './types.ts'

export const phases: Phase[] = [phase01, phase02]
export const cities = citiesA1

const senseById = new Map<string, Sense>()
const phaseBySense = new Map<string, Phase>()
for (const phase of phases) {
  for (const s of phase.senses) {
    senseById.set(s.id, s)
    phaseBySense.set(s.id, phase)
  }
}

export function getSense(id: string): Sense | undefined {
  return senseById.get(id)
}

export function getPhaseOfSense(id: string): Phase | undefined {
  return phaseBySense.get(id)
}

export function allSenses(): Sense[] {
  return [...senseById.values()]
}
