import type { CharacterChoice, PetChoice } from '../db/db.ts'

// Choices for the traveler, used by the first-launch setup, the map and Ajustes.

export const CHARACTERS: { value: CharacterChoice; icon: string; label: string }[] = [
  { value: 'male', icon: '🧔', label: 'Viajante' },
  { value: 'female', icon: '👩', label: 'Viajante' },
]

export const PETS: { value: PetChoice; icon: string; label: string }[] = [
  { value: 'dog', icon: '🐶', label: 'Cachorro' },
  { value: 'cat', icon: '🐱', label: 'Gato' },
  { value: 'none', icon: '🚫', label: 'Sem pet' },
]

export const characterIcon = (c: CharacterChoice) => CHARACTERS.find((x) => x.value === c)?.icon ?? '🧑'
export const petIcon = (p: PetChoice) => (p === 'none' ? '' : PETS.find((x) => x.value === p)?.icon ?? '')
