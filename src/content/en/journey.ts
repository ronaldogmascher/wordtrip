import type { Cefr, City } from '../types.ts'

// The whole road trip: 80 cities in four legs, one per CEFR level, 50 words each.
// The order is playful, not geographic. The last city of each leg is a border with a bigger boss.
// Cities marked `available: false` are on the map but their words ship in a later version.

type Stop = [name: string, region: string, landmark: string, icon: string]

const leg = (cefr: Cefr, stops: Stop[], available = false): City[] =>
  stops.map(([name, region, landmark, icon], i) => ({
    phaseId: `en:${cefr.toLowerCase()}:${String(i + 1).padStart(2, '0')}`,
    number: 0, // set below, counted along the whole trip
    cefr, name, region, landmark, icon, available,
  }))

export const citiesA1: City[] = [
  { phaseId: 'en:a1:01', number: 1, name: 'Sua cidade', region: '', landmark: 'Ponto de partida', icon: '🏠', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:02', number: 2, name: 'São Paulo', region: 'SP', landmark: 'Avenida Paulista', icon: '🏙️', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:03', number: 3, name: 'Rio de Janeiro', region: 'RJ', landmark: 'Cristo Redentor', icon: '🏖️', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:04', number: 4, name: 'Ouro Preto', region: 'MG', landmark: 'Igrejas barrocas', icon: '⛪', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:05', number: 5, name: 'Salvador', region: 'BA', landmark: 'Pelourinho', icon: '🥁', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:06', number: 6, name: 'Lençóis Maranhenses', region: 'MA', landmark: 'Dunas e lagoas', icon: '🏜️', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:07', number: 7, name: 'Fernando de Noronha', region: 'PE', landmark: 'Morro Dois Irmãos', icon: '🐢', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:08', number: 8, name: 'Manaus', region: 'AM', landmark: 'Teatro Amazonas', icon: '🌳', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:09', number: 9, name: 'Pantanal', region: 'MT/MS', landmark: 'Tuiuiú', icon: '🐊', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:10', number: 10, name: 'Bonito', region: 'MS', landmark: 'Rios cristalinos', icon: '🐠', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:11', number: 11, name: 'Balneário Camboriú', region: 'SC', landmark: 'Orla e roda-gigante', icon: '🎡', available: true, cefr: 'A1' },
  { phaseId: 'en:a1:12', number: 12, name: 'Foz do Iguaçu', region: 'PR', landmark: 'Cataratas do Iguaçu (fronteira)', icon: '💦', available: true, cefr: 'A1' },
]

export const citiesA2 = leg('A2', [
  ['Buenos Aires', 'Argentina', 'Tango em San Telmo', '💃'],
  ['Bariloche', 'Argentina', 'Lagos e chocolate', '🍫'],
  ['Patagônia', 'Argentina', 'Geleira Perito Moreno', '🧊'],
  ['Santiago', 'Chile', 'Cordilheira dos Andes', '🏔️'],
  ['Deserto do Atacama', 'Chile', 'Céu estrelado', '🌌'],
  ['Salar de Uyuni', 'Bolívia', 'O deserto de sal', '🧂'],
  ['Machu Picchu', 'Peru', 'Cidade inca', '🦙'],
  ['Lima', 'Peru', 'Culinária peruana', '🍋'],
  ['Ilhas Galápagos', 'Equador', 'Tartarugas gigantes', '🐢'],
  ['Medellín', 'Colômbia', 'Cidade da eterna primavera', '🌸'],
  ['Cartagena', 'Colômbia', 'Cidade murada', '🏰'],
  ['Canal do Panamá', 'Panamá', 'Eclusas do canal (fronteira)', '🚢'],
])

export const citiesB1 = leg('B1', [
  ['Costa Rica', 'Costa Rica', 'Vulcões e preguiças', '🦥'],
  ['Tikal', 'Guatemala', 'Pirâmides maias', '🛕'],
  ['Cancún', 'México', 'Mar do Caribe', '🏝️'],
  ['Tulum', 'México', 'Ruínas na praia', '🏛️'],
  ['Cidade do México', 'México', 'Casa de Frida Kahlo', '🎨'],
  ['Acapulco', 'México', 'Mergulhadores do penhasco', '🤿'],
  ['Houston', 'Texas', 'Centro espacial da NASA', '🚀'],
  ['San Antonio', 'Texas', 'O Álamo', '🤠'],
  ['Nova Orleans', 'Luisiana', 'Jazz no French Quarter', '🎷'],
  ['Miami', 'Flórida', 'Ocean Drive', '🌴'],
  ['Key West', 'Flórida', 'A estrada sobre o mar', '🌉'],
  ['Orlando', 'Flórida', 'Parques temáticos', '🎢'],
  ['Nashville', 'Tennessee', 'Música country', '🎸'],
  ['Memphis', 'Tennessee', 'A casa de Elvis', '🕺'],
  ['Santa Fe', 'Novo México', 'Rota 66', '🛣️'],
  ['Grand Canyon', 'Arizona', 'O grande cânion', '🏜️'],
  ['Monument Valley', 'Utah', 'Rochas do Velho Oeste', '🪨'],
  ['Las Vegas', 'Nevada', 'A Strip', '🎰'],
  ['San Diego', 'Califórnia', 'Praias e leões-marinhos', '🦭'],
  ['Los Angeles', 'Califórnia', 'Letreiro de Hollywood', '🎬'],
  ['Big Sur', 'Califórnia', 'Highway 1', '🌊'],
  ['San Francisco', 'Califórnia', 'Golden Gate', '🌁'],
  ['Yosemite', 'Califórnia', 'Sequoias gigantes', '🌲'],
  ['Portland', 'Oregon', 'Food trucks e livrarias', '📚'],
  ['Seattle', 'Washington', 'Space Needle', '🗼'],
  ['Vancouver', 'Canadá', 'Stanley Park (fronteira)', '🍁'],
])

export const citiesB2 = leg('B2', [
  ['Anchorage', 'Alasca', 'Porta de entrada do Alasca', '🛩️'],
  ['Denali', 'Alasca', 'A montanha mais alta da América do Norte', '⛰️'],
  ['Juneau', 'Alasca', 'Geleiras e baleias', '🐋'],
  ['Yukon', 'Canadá', 'Aurora boreal', '🌠'],
  ['Banff', 'Canadá', 'Montanhas Rochosas', '🦌'],
  ['Lago Louise', 'Canadá', 'Lago azul-turquesa', '🛶'],
  ['Calgary', 'Canadá', 'Rodeio', '🐎'],
  ['Yellowstone', 'Wyoming', 'Gêiseres', '♨️'],
  ['Monte Rushmore', 'Dakota do Sul', 'Rostos de presidentes na pedra', '🗿'],
  ['Denver', 'Colorado', 'A cidade a uma milha de altitude', '🏂'],
  ['Chicago', 'Illinois', 'O "feijão" do Millennium Park', '🌭'],
  ['Detroit', 'Michigan', 'Motown', '🎤'],
  ['Toronto', 'Canadá', 'CN Tower', '🏒'],
  ['Cataratas do Niágara', 'Canadá', 'As quedas na fronteira', '🌈'],
  ['Ottawa', 'Canadá', 'Parlamento', '🏛️'],
  ['Montreal', 'Canadá', 'Bagels e festivais', '🥯'],
  ['Quebec', 'Canadá', 'A cidade velha', '🏯'],
  ['Boston', 'Massachusetts', 'Harvard', '🎓'],
  ['Salem', 'Massachusetts', 'A cidade das bruxas', '🧙'],
  ['Cape Cod', 'Massachusetts', 'Faróis e dunas', '🦞'],
  ['Filadélfia', 'Pensilvânia', 'O Sino da Liberdade', '🔔'],
  ['Washington D.C.', 'Distrito de Colúmbia', 'Casa Branca', '🦅'],
  ['The Hamptons', 'Nova York', 'Casas de praia', '⛱️'],
  ['Brooklyn', 'Nova York', 'A ponte do Brooklyn', '🌉'],
  ['Estátua da Liberdade', 'Nova York', 'A tocha da liberdade', '🗽'],
  ['Central Park', 'Nova York', 'O parque no meio da cidade', '🌳'],
  ['Broadway', 'Nova York', 'Musicais', '🎭'],
  ['Wall Street', 'Nova York', 'A bolsa de valores', '📈'],
  ['Times Square', 'Nova York', 'Os telões', '🌃'],
  ['Empire State Building', 'Nova York', 'Chegada a Nova York!', '🏆'],
])

/** Every city of the trip, numbered from 1 to 80. */
export const allCities: City[] = [...citiesA1, ...citiesA2, ...citiesB1, ...citiesB2].map((c, i) => ({ ...c, number: i + 1 }))
