// A tiny Portuguese conjugator, just enough to translate the grammar training sentences
// ("She worked last week." → "Ela trabalhou semana passada."). It handles regular -ar/-er/-ir
// verbs, common spelling changes and a table of irregular verbs used by the route.

/** Grammatical person: eu, você/ele/ela, nós, eles. */
export type Person = 'eu' | 'ele' | 'nos' | 'eles'

type Four = [string, string, string, string]

const IRREGULAR: Record<string, { present?: Four; past?: Four }> = {
  ter: { present: ['tenho', 'tem', 'temos', 'têm'], past: ['tive', 'teve', 'tivemos', 'tiveram'] },
  fazer: { present: ['faço', 'faz', 'fazemos', 'fazem'], past: ['fiz', 'fez', 'fizemos', 'fizeram'] },
  dizer: { present: ['digo', 'diz', 'dizemos', 'dizem'], past: ['disse', 'disse', 'dissemos', 'disseram'] },
  ir: { present: ['vou', 'vai', 'vamos', 'vão'], past: ['fui', 'foi', 'fomos', 'foram'] },
  saber: { present: ['sei', 'sabe', 'sabemos', 'sabem'], past: ['soube', 'soube', 'soubemos', 'souberam'] },
  ver: { present: ['vejo', 'vê', 'vemos', 'veem'], past: ['vi', 'viu', 'vimos', 'viram'] },
  vir: { present: ['venho', 'vem', 'vimos', 'vêm'], past: ['vim', 'veio', 'viemos', 'vieram'] },
  querer: { present: ['quero', 'quer', 'queremos', 'querem'], past: ['quis', 'quis', 'quisemos', 'quiseram'] },
  dar: { present: ['dou', 'dá', 'damos', 'dão'], past: ['dei', 'deu', 'demos', 'deram'] },
  pôr: { present: ['ponho', 'põe', 'pomos', 'põem'], past: ['pus', 'pôs', 'pusemos', 'puseram'] },
  trazer: { present: ['trago', 'traz', 'trazemos', 'trazem'], past: ['trouxe', 'trouxe', 'trouxemos', 'trouxeram'] },
  ouvir: { present: ['ouço', 'ouve', 'ouvimos', 'ouvem'] },
  ler: { present: ['leio', 'lê', 'lemos', 'leem'] },
  dormir: { present: ['durmo', 'dorme', 'dormimos', 'dormem'] },
  sentir: { present: ['sinto', 'sente', 'sentimos', 'sentem'] },
  subir: { present: ['subo', 'sobe', 'subimos', 'sobem'] },
  seguir: { present: ['sigo', 'segue', 'seguimos', 'seguem'] },
  conseguir: { present: ['consigo', 'consegue', 'conseguimos', 'conseguem'] },
  perder: { present: ['perco', 'perde', 'perdemos', 'perdem'] },
  tossir: { present: ['tusso', 'tosse', 'tossimos', 'tossem'] },
  medir: { present: ['meço', 'mede', 'medimos', 'medem'] },
  pedir: { present: ['peço', 'pede', 'pedimos', 'pedem'] },
  descobrir: { present: ['descubro', 'descobre', 'descobrimos', 'descobrem'] },
  repetir: { present: ['repito', 'repete', 'repetimos', 'repetem'] },
  vestir: { present: ['visto', 'veste', 'vestimos', 'vestem'] },
  produzir: { present: ['produzo', 'produz', 'produzimos', 'produzem'] },
  rir: { present: ['rio', 'ri', 'rimos', 'riem'], past: ['ri', 'riu', 'rimos', 'riram'] },
  sorrir: { present: ['sorrio', 'sorri', 'sorrimos', 'sorriem'], past: ['sorri', 'sorriu', 'sorrimos', 'sorriram'] },
  cair: { present: ['caio', 'cai', 'caímos', 'caem'], past: ['caí', 'caiu', 'caímos', 'caíram'] },
  sair: { present: ['saio', 'sai', 'saímos', 'saem'], past: ['saí', 'saiu', 'saímos', 'saíram'] },
  incluir: { present: ['incluo', 'inclui', 'incluímos', 'incluem'], past: ['incluí', 'incluiu', 'incluímos', 'incluíram'] },
  construir: { present: ['construo', 'constrói', 'construímos', 'constroem'], past: ['construí', 'construiu', 'construímos', 'construíram'] },
}

const INDEX: Record<Person, number> = { eu: 0, ele: 1, nos: 2, eles: 3 }
const ESTAR: Four = ['estou', 'está', 'estamos', 'estão']
const IR: Four = IRREGULAR.ir.present!

const ending = (verb: string) => verb.slice(-2) as 'ar' | 'er' | 'ir'
const stem = (verb: string) => verb.slice(0, -2)

/** Only simple infinitives can be conjugated (with an optional complement after them). */
export const isConjugable = (verb: string) => verb === 'pôr' || /^[a-zçãõáéíóúâêô]+(ar|er|ir)$/.test(verb)

function regularPresent(verb: string): Four {
  const s = stem(verb)
  const e = ending(verb)
  // First person spelling changes: conhecer → conheço, proteger → protejo, dirigir → dirijo.
  let first = s + 'o'
  if (/c(er|ir)$/.test(verb)) first = s.slice(0, -1) + 'ço'
  else if (/g(er|ir)$/.test(verb)) first = s.slice(0, -1) + 'jo'
  if (e === 'ar') return [first, s + 'a', s + 'amos', s + 'am']
  if (e === 'er') return [first, s + 'e', s + 'emos', s + 'em']
  return [first, s + 'e', s + 'imos', s + 'em']
}

function regularPast(verb: string): Four {
  const s = stem(verb)
  const e = ending(verb)
  if (e === 'ar') {
    // ficar → fiquei, chegar → cheguei, começar → comecei.
    let first = s + 'ei'
    if (s.endsWith('c')) first = s.slice(0, -1) + 'quei'
    else if (s.endsWith('g')) first = s + 'uei'
    else if (s.endsWith('ç')) first = s.slice(0, -1) + 'cei'
    return [first, s + 'ou', s + 'amos', s + 'aram']
  }
  if (e === 'er') return [s + 'i', s + 'eu', s + 'emos', s + 'eram']
  return [s + 'i', s + 'iu', s + 'imos', s + 'iram']
}

export function present(verb: string, person: Person): string {
  return (IRREGULAR[verb]?.present ?? regularPresent(verb))[INDEX[person]]
}

export function past(verb: string, person: Person): string {
  return (IRREGULAR[verb]?.past ?? regularPast(verb))[INDEX[person]]
}

export function gerund(verb: string): string {
  return verb === 'pôr' ? 'pondo' : stem(verb) + (ending(verb) === 'ar' ? 'ando' : ending(verb) === 'er' ? 'endo' : 'indo')
}

export const estar = (person: Person) => ESTAR[INDEX[person]]

/** "vou trabalhar"; for "ir" itself Portuguese just says "vou". */
export const future = (verb: string, person: Person) => (verb === 'ir' ? IR[INDEX[person]] : `${IR[INDEX[person]]} ${verb}`)

/**
 * The first meaning of a dictionary translation, ready to conjugate:
 * "sentar(-se)" → "sentar", "ligar (por telefone)" → "ligar", "ficar de pé" stays.
 * Returns null for meanings that can't be conjugated simply ("preocupar-se").
 */
export function mainVerb(translationPt: string): { verb: string; rest: string } | null {
  const first = translationPt.replace(/\(.*?\)/g, '').split(/[,;]/)[0].trim()
  const [verb, ...rest] = first.split(/\s+/)
  if (!isConjugable(verb)) return null
  return { verb, rest: rest.length ? ` ${rest.join(' ')}` : '' }
}
