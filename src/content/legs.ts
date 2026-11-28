// The four legs of the journey (80 cities, 50 words each), one per CEFR level. Shown in the manual. Word counts are cumulative targets.

export interface Leg {
  cefr: 'A1' | 'A2' | 'B1' | 'B2'
  name: string
  /** Total senses learned by the end of this leg (approximate). */
  words: number
  places: string
}

export const LEGS: Leg[] = [
  { cefr: 'A1', name: 'Brasil', words: 600, places: 'Sua cidade (ponto de partida), São Paulo, Rio de Janeiro, Ouro Preto, Salvador, Lençóis Maranhenses, Fernando de Noronha, Manaus, Pantanal, Bonito, Balneário Camboriú e Foz do Iguaçu (fronteira)' },
  { cefr: 'A2', name: 'América do Sul', words: 1200, places: 'Buenos Aires, Bariloche, Patagônia, Santiago, Atacama, Salar de Uyuni, Machu Picchu, Lima, Galápagos, Medellín, Cartagena e Canal do Panamá (fronteira)' },
  { cefr: 'B1', name: 'América Central, México e EUA', words: 2500, places: 'Costa Rica, Tikal, Cancún, Tulum, Cidade do México, Acapulco, Houston, San Antonio, Nova Orleans, Miami, Key West, Orlando, Nashville, Memphis, Santa Fe, Grand Canyon, Monument Valley, Las Vegas, San Diego, Los Angeles, Big Sur, San Francisco, Yosemite, Portland, Seattle e Vancouver (fronteira)' },
  { cefr: 'B2', name: 'Canadá, Alasca e Nova York', words: 4000, places: 'Anchorage, Denali, Juneau, Yukon, Banff, Lago Louise, Calgary, Yellowstone, Monte Rushmore, Denver, Chicago, Detroit, Toronto, Niágara, Ottawa, Montreal, Quebec, Boston, Salem, Cape Cod, Filadélfia, Washington, The Hamptons e o tour final por Nova York: Brooklyn, Estátua da Liberdade, Central Park, Broadway, Wall Street, Times Square e Empire State Building' },
]
