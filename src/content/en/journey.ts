import type { City } from '../types.ts'

// The A1 leg of the journey: 12 Brazilian cities, ending at the border in Foz do Iguaçu.
// Later legs (A2 Latin America, B1 West Coast USA, B2 crossing to New York) are added later.
export const citiesA1: City[] = [
  { phaseId: 'en:a1:01', number: 1, name: 'Santo André', region: 'SP', landmark: 'Ponto de partida', available: true },
  { phaseId: 'en:a1:02', number: 2, name: 'São Paulo', region: 'SP', landmark: 'Avenida Paulista', available: false },
  { phaseId: 'en:a1:03', number: 3, name: 'Rio de Janeiro', region: 'RJ', landmark: 'Cristo Redentor', available: false },
  { phaseId: 'en:a1:04', number: 4, name: 'Ouro Preto', region: 'MG', landmark: 'Igrejas barrocas', available: false },
  { phaseId: 'en:a1:05', number: 5, name: 'Salvador', region: 'BA', landmark: 'Pelourinho', available: false },
  { phaseId: 'en:a1:06', number: 6, name: 'Lençóis Maranhenses', region: 'MA', landmark: 'Dunas e lagoas', available: false },
  { phaseId: 'en:a1:07', number: 7, name: 'Fernando de Noronha', region: 'PE', landmark: 'Morro Dois Irmãos', available: false },
  { phaseId: 'en:a1:08', number: 8, name: 'Manaus', region: 'AM', landmark: 'Teatro Amazonas', available: false },
  { phaseId: 'en:a1:09', number: 9, name: 'Pantanal', region: 'MT/MS', landmark: 'Tuiuiú', available: false },
  { phaseId: 'en:a1:10', number: 10, name: 'Bonito', region: 'MS', landmark: 'Rios cristalinos', available: false },
  { phaseId: 'en:a1:11', number: 11, name: 'Balneário Camboriú', region: 'SC', landmark: 'Orla e roda-gigante', available: false },
  { phaseId: 'en:a1:12', number: 12, name: 'Foz do Iguaçu', region: 'PR', landmark: 'Cataratas do Iguaçu (fronteira)', available: false },
]
