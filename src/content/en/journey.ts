import type { City } from '../types.ts'

// The A1 leg of the journey: the traveler's home (phase 1) and 11 Brazilian cities, ending at the border in Foz do Iguaçu.
// Later legs (A2 Latin America, B1 West Coast USA, B2 crossing to New York) are added later.
export const citiesA1: City[] = [
  { phaseId: 'en:a1:01', number: 1, name: 'Sua cidade', region: '', landmark: 'Ponto de partida', icon: '🏠', available: true },
  { phaseId: 'en:a1:02', number: 2, name: 'São Paulo', region: 'SP', landmark: 'Avenida Paulista', icon: '🏙️', available: true },
  { phaseId: 'en:a1:03', number: 3, name: 'Rio de Janeiro', region: 'RJ', landmark: 'Cristo Redentor', icon: '🏖️', available: true },
  { phaseId: 'en:a1:04', number: 4, name: 'Ouro Preto', region: 'MG', landmark: 'Igrejas barrocas', icon: '⛪', available: true },
  { phaseId: 'en:a1:05', number: 5, name: 'Salvador', region: 'BA', landmark: 'Pelourinho', icon: '🥁', available: true },
  { phaseId: 'en:a1:06', number: 6, name: 'Lençóis Maranhenses', region: 'MA', landmark: 'Dunas e lagoas', icon: '🏜️', available: true },
  { phaseId: 'en:a1:07', number: 7, name: 'Fernando de Noronha', region: 'PE', landmark: 'Morro Dois Irmãos', icon: '🐢', available: true },
  { phaseId: 'en:a1:08', number: 8, name: 'Manaus', region: 'AM', landmark: 'Teatro Amazonas', icon: '🌳', available: true },
  { phaseId: 'en:a1:09', number: 9, name: 'Pantanal', region: 'MT/MS', landmark: 'Tuiuiú', icon: '🐊', available: true },
  { phaseId: 'en:a1:10', number: 10, name: 'Bonito', region: 'MS', landmark: 'Rios cristalinos', icon: '🐠', available: true },
  { phaseId: 'en:a1:11', number: 11, name: 'Balneário Camboriú', region: 'SC', landmark: 'Orla e roda-gigante', icon: '🎡', available: true },
  { phaseId: 'en:a1:12', number: 12, name: 'Foz do Iguaçu', region: 'PR', landmark: 'Cataratas do Iguaçu (fronteira)', icon: '💦', available: true },
]
