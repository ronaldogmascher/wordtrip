// The four legs of the journey, one per CEFR level. Only the A1 leg ships for now; the others
// describe the plan (shown in the manual). Word counts are cumulative targets.

export interface Leg {
  cefr: 'A1' | 'A2' | 'B1' | 'B2'
  name: string
  /** Total senses learned by the end of this leg (approximate). */
  words: number
  places: string
}

export const LEGS: Leg[] = [
  { cefr: 'A1', name: 'Brasil', words: 600, places: 'Sua cidade (ponto de partida), São Paulo, Rio de Janeiro, Ouro Preto, Salvador, Lençóis Maranhenses, Fernando de Noronha, Manaus, Pantanal, Bonito, Balneário Camboriú e Foz do Iguaçu (fronteira)' },
  { cefr: 'A2', name: 'América Latina', words: 1200, places: 'Buenos Aires, Santiago, Lima, Machu Picchu, Colômbia, Panamá, Costa Rica e Cidade do México' },
  { cefr: 'B1', name: 'Costa oeste dos EUA', words: 2500, places: 'San Diego, Los Angeles, Las Vegas, Grand Canyon, San Francisco e Seattle' },
  { cefr: 'B2', name: 'Travessia até Nova York', words: 4000, places: 'Chicago, Nashville, Nova Orleans, Washington e, por fim, Nova York' },
]
