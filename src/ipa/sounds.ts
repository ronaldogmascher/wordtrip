// The sounds of English (IPA), compared with Brazilian Portuguese.
// Where American and British English use different symbols, both are given.

export type SoundKind = 'vowel' | 'diphthong' | 'consonant'

/** How close the sound is to something in Portuguese. */
export type PtMatch = 'same' | 'close' | 'new'

export interface Example {
  word: string
  us: string
  uk: string
}

export interface Sound {
  id: string
  /** Symbol in American and British transcriptions (often the same). */
  us: string
  uk: string
  kind: SoundKind
  match: PtMatch
  /** Comparison with Portuguese, in Portuguese. */
  pt: string
  examples: Example[]
  /** Extra advice for Brazilian learners. */
  tip?: string
}

export const PT_MATCH: Record<PtMatch, { icon: string; label: string }> = {
  same: { icon: '✅', label: 'Igual ao português' },
  close: { icon: '≈', label: 'Parecido, com diferença' },
  new: { icon: '🆕', label: 'Não existe em português' },
}

const ex = (word: string, us: string, uk = us): Example => ({ word, us, uk })

export const SOUNDS: Sound[] = [
  // Vowels
  { id: 'i-long', us: 'iː', uk: 'iː', kind: 'vowel', match: 'close', pt: 'Como o "i" de "vida", só que mais longo e com os lábios esticados, como num sorriso.',
    examples: [ex('see', 'siː'), ex('sheep', 'ʃiːp'), ex('eat', 'iːt')] },
  { id: 'i-short', us: 'ɪ', uk: 'ɪ', kind: 'vowel', match: 'new', pt: 'Fica entre o "i" e o "ê", curto e relaxado. Não existe em português.',
    examples: [ex('sit', 'sɪt'), ex('ship', 'ʃɪp'), ex('big', 'bɪɡ')],
    tip: 'Se você falar "ship" com o "i" de "vida", vira "sheep" (ovelha). Relaxe a boca.' },
  { id: 'e', us: 'e', uk: 'e', kind: 'vowel', match: 'close', pt: 'Parecido com o "é" de "pé", mas um pouco mais fechado.',
    examples: [ex('bed', 'bed'), ex('ten', 'ten'), ex('friend', 'frend')] },
  { id: 'ae', us: 'æ', uk: 'æ', kind: 'vowel', match: 'new', pt: 'Uma mistura de "é" com "a", com a boca bem aberta. Não existe em português.',
    examples: [ex('cat', 'kæt'), ex('bad', 'bæd'), ex('man', 'mæn')],
    tip: 'Diga "é" e vá abrindo a boca em direção ao "a". É o som de "bad", diferente de "bed".' },
  { id: 'a-long', us: 'ɑː', uk: 'ɑː', kind: 'vowel', match: 'same', pt: 'Como o "a" de "casa", aberto e um pouco mais longo.',
    examples: [ex('father', 'ˈfɑːðɚ', 'ˈfɑːðə'), ex('car', 'kɑːr', 'kɑː'), ex('hot', 'hɑːt', 'hɒt')],
    tip: 'No inglês americano, palavras como "hot" e "stop" usam este "a" aberto.' },
  { id: 'o-short', us: 'ɑː', uk: 'ɒ', kind: 'vowel', match: 'close', pt: 'Só no inglês britânico: um "ó" curto, com a boca arredondada. No americano vira "a" aberto.',
    examples: [ex('hot', 'hɑːt', 'hɒt'), ex('stop', 'stɑːp', 'stɒp'), ex('dog', 'dɑːɡ', 'dɒɡ')] },
  { id: 'o-long', us: 'ɔː', uk: 'ɔː', kind: 'vowel', match: 'close', pt: 'Como o "ó" de "avó", mais longo.',
    examples: [ex('law', 'lɔː'), ex('walk', 'wɔːk'), ex('thought', 'θɔːt')],
    tip: 'Muitos americanos falam este som quase como o "a" aberto: "law" soa perto de "lá".' },
  { id: 'u-short', us: 'ʊ', uk: 'ʊ', kind: 'vowel', match: 'close', pt: 'Um "u" curto e relaxado, com os lábios pouco arredondados.',
    examples: [ex('book', 'bʊk'), ex('put', 'pʊt'), ex('good', 'ɡʊd')],
    tip: '"full" (cheio) tem este "u" curto; "fool" (bobo) tem o "u" longo.' },
  { id: 'u-long', us: 'uː', uk: 'uː', kind: 'vowel', match: 'close', pt: 'Como o "u" de "lua", mais longo e com os lábios bem arredondados.',
    examples: [ex('food', 'fuːd'), ex('blue', 'bluː'), ex('school', 'skuːl')] },
  { id: 'uh', us: 'ʌ', uk: 'ʌ', kind: 'vowel', match: 'close', pt: 'Um "a" curto e fechado, parecido com o "â" de "cama".',
    examples: [ex('cup', 'kʌp'), ex('love', 'lʌv'), ex('money', 'ˈmʌni')],
    tip: 'Não use o "ó": "love" é "lâv", não "lóv".' },
  { id: 'er', us: 'ɝː', uk: 'ɜː', kind: 'vowel', match: 'new', pt: 'Uma vogal neutra e longa. No americano vem com o "r" enrolado junto; no britânico, sem "r".',
    examples: [ex('bird', 'bɝːd', 'bɜːd'), ex('work', 'wɝːk', 'wɜːk'), ex('learn', 'lɝːn', 'lɜːn')],
    tip: '"work" (trabalho) não é "uórk": a vogal não é "ó". Compare com "walk" (andar).' },
  { id: 'schwa', us: 'ə', uk: 'ə', kind: 'vowel', match: 'close', pt: 'O "schwa": vogal fraca e neutra, como o "a" final de "casa" falado rápido. É o som mais comum do inglês.',
    examples: [ex('about', 'əˈbaʊt'), ex('banana', 'bəˈnænə', 'bəˈnɑːnə'), ex('today', 'təˈdeɪ')],
    tip: 'Sílabas sem acento quase sempre viram schwa. Não pronuncie todas as vogais com força.' },
  { id: 'schwa-r', us: 'ɚ', uk: 'ə', kind: 'vowel', match: 'new', pt: 'No americano, o schwa com "r" enrolado no fim (como o "r" caipira). No britânico, schwa simples.',
    examples: [ex('teacher', 'ˈtiːtʃɚ', 'ˈtiːtʃə'), ex('water', 'ˈwɑːtɚ', 'ˈwɔːtə'), ex('doctor', 'ˈdɑːktɚ', 'ˈdɒktə')] },

  // Diphthongs
  { id: 'ei', us: 'eɪ', uk: 'eɪ', kind: 'diphthong', match: 'same', pt: 'Como o "ei" de "lei".',
    examples: [ex('day', 'deɪ'), ex('name', 'neɪm'), ex('rain', 'reɪn')] },
  { id: 'ai', us: 'aɪ', uk: 'aɪ', kind: 'diphthong', match: 'same', pt: 'Como o "ai" de "pai".',
    examples: [ex('my', 'maɪ'), ex('time', 'taɪm'), ex('night', 'naɪt')] },
  { id: 'oi', us: 'ɔɪ', uk: 'ɔɪ', kind: 'diphthong', match: 'same', pt: 'Como o "ói" de "herói".',
    examples: [ex('boy', 'bɔɪ'), ex('coin', 'kɔɪn'), ex('enjoy', 'ɪnˈdʒɔɪ')] },
  { id: 'au', us: 'aʊ', uk: 'aʊ', kind: 'diphthong', match: 'same', pt: 'Como o "au" de "mau".',
    examples: [ex('now', 'naʊ'), ex('house', 'haʊs'), ex('town', 'taʊn')] },
  { id: 'ou', us: 'oʊ', uk: 'əʊ', kind: 'diphthong', match: 'close', pt: 'Americano: como o "ou" de "vou", bem marcado. Britânico: começa num schwa, "êu".',
    examples: [ex('go', 'ɡoʊ', 'ɡəʊ'), ex('home', 'hoʊm', 'həʊm'), ex('boat', 'boʊt', 'bəʊt')],
    tip: 'Não pronuncie "ó" puro: "coat" (casaco) e "caught" (pegou) são diferentes.' },
  { id: 'ear', us: 'ɪr', uk: 'ɪə', kind: 'diphthong', match: 'new', pt: 'Um "i" relaxado seguido de "r" (americano) ou de schwa (britânico, sem "r").',
    examples: [ex('here', 'hɪr', 'hɪə'), ex('near', 'nɪr', 'nɪə'), ex('beer', 'bɪr', 'bɪə')] },
  { id: 'air', us: 'er', uk: 'eə', kind: 'diphthong', match: 'new', pt: 'Um "é" seguido de "r" (americano) ou de schwa (britânico).',
    examples: [ex('hair', 'her', 'heə'), ex('where', 'wer', 'weə'), ex('chair', 'tʃer', 'tʃeə')] },

  // Consonants
  { id: 'th-voiceless', us: 'θ', uk: 'θ', kind: 'consonant', match: 'new', pt: 'Ponta da língua entre os dentes, soltando ar sem voz. Não existe em português.',
    examples: [ex('think', 'θɪŋk'), ex('three', 'θriː'), ex('mouth', 'maʊθ')],
    tip: 'Não troque por "t", "f" ou "s": "think" não é "tink", "fink" nem "sink".' },
  { id: 'th-voiced', us: 'ð', uk: 'ð', kind: 'consonant', match: 'new', pt: 'A mesma posição do anterior (língua entre os dentes), mas com voz, vibrando. Não existe em português.',
    examples: [ex('this', 'ðɪs'), ex('they', 'ðeɪ'), ex('mother', 'ˈmʌðɚ', 'ˈmʌðə')],
    tip: 'Não troque por "d": "they" (eles) não é "day" (dia).' },
  { id: 'h', us: 'h', uk: 'h', kind: 'consonant', match: 'close', pt: 'Um sopro leve, parecido com o "r" de "rato", mas bem mais suave, só com ar.',
    examples: [ex('house', 'haʊs'), ex('hello', 'həˈloʊ', 'həˈləʊ'), ex('happy', 'ˈhæpi')],
    tip: 'Não deixe o "h" mudo como em português: "hat" (chapéu) e "at" (em) são palavras diferentes.' },
  { id: 'r', us: 'r', uk: 'r', kind: 'consonant', match: 'close', pt: 'A língua vai para trás sem encostar no céu da boca, como o "r" caipira de "porta".',
    examples: [ex('red', 'red'), ex('right', 'raɪt'), ex('very', 'ˈveri')],
    tip: 'No começo da palavra não é o "rr" de "carro": "red" não é "héd". No britânico, o "r" depois de vogal (car, more) não é pronunciado.' },
  { id: 'flap-t', us: 'ɾ', uk: 't', kind: 'consonant', match: 'close', pt: 'No americano, o "t" entre vogais vira um "r" rápido, como o "r" de "caro".',
    examples: [ex('water', 'ˈwɑːɾɚ', 'ˈwɔːtə'), ex('better', 'ˈbeɾɚ', 'ˈbetə'), ex('city', 'ˈsɪɾi', 'ˈsɪti')],
    tip: 'Os dicionários costumam escrever /t/; o "r" rápido é como os americanos falam no dia a dia.' },
  { id: 'l', us: 'l', uk: 'l', kind: 'consonant', match: 'close', pt: 'Como o "l" de "lua". No fim da palavra a língua continua encostando atrás dos dentes.',
    examples: [ex('light', 'laɪt'), ex('feel', 'fiːl'), ex('ball', 'bɔːl')],
    tip: 'No fim da palavra não vire "u": "ball" não é "bóu". Encoste a língua.' },
  { id: 'ng', us: 'ŋ', uk: 'ŋ', kind: 'consonant', match: 'close', pt: 'O som nasal do fundo da boca, como em "manga", mas sem pronunciar o "g" no final.',
    examples: [ex('sing', 'sɪŋ'), ex('long', 'lɔːŋ', 'lɒŋ'), ex('thing', 'θɪŋ')],
    tip: '"sing" termina no som nasal: não diga "singui".' },
  { id: 'm-final', us: 'm', uk: 'm', kind: 'consonant', match: 'close', pt: 'Como o "m" de "mão". No fim da palavra, feche bem os lábios.',
    examples: [ex('time', 'taɪm'), ex('home', 'hoʊm', 'həʊm'), ex('name', 'neɪm')],
    tip: 'Em português o "m" final só nasaliza a vogal ("bem"); em inglês os lábios se fecham: "time" termina com "mm".' },
  { id: 't-d', us: 't d', uk: 't d', kind: 'consonant', match: 'close', pt: 'Como o "t" e o "d" de "tatu" e "dado", mesmo antes de "i".',
    examples: [ex('tea', 'tiː'), ex('did', 'dɪd'), ex('city', 'ˈsɪɾi', 'ˈsɪti')],
    tip: 'Não faça "tchi" e "dji": "tea" não é "tchí". Também não acrescente "i" no fim: "did" não é "didi".' },
  { id: 'ch', us: 'tʃ', uk: 'tʃ', kind: 'consonant', match: 'same', pt: 'Como o "tch" de "tchau".',
    examples: [ex('chair', 'tʃer', 'tʃeə'), ex('watch', 'wɑːtʃ', 'wɒtʃ'), ex('teacher', 'ˈtiːtʃɚ', 'ˈtiːtʃə')] },
  { id: 'j', us: 'dʒ', uk: 'dʒ', kind: 'consonant', match: 'same', pt: 'Como o "d" de "dia" no sotaque paulista ou carioca: "dj".',
    examples: [ex('job', 'dʒɑːb', 'dʒɒb'), ex('June', 'dʒuːn'), ex('bridge', 'brɪdʒ')] },
  { id: 'sh', us: 'ʃ', uk: 'ʃ', kind: 'consonant', match: 'same', pt: 'Como o "ch" de "chá".',
    examples: [ex('she', 'ʃiː'), ex('shop', 'ʃɑːp', 'ʃɒp'), ex('fish', 'fɪʃ')] },
  { id: 'zh', us: 'ʒ', uk: 'ʒ', kind: 'consonant', match: 'same', pt: 'Como o "j" de "já".',
    examples: [ex('vision', 'ˈvɪʒən'), ex('usually', 'ˈjuːʒuəli'), ex('television', 'ˈteləvɪʒən', 'ˈtelɪvɪʒən')] },
  { id: 'w', us: 'w', uk: 'w', kind: 'consonant', match: 'close', pt: 'Como o "u" rápido de "quatro", com os lábios arredondados.',
    examples: [ex('water', 'ˈwɑːtɚ', 'ˈwɔːtə'), ex('week', 'wiːk'), ex('one', 'wʌn')] },
  { id: 'y', us: 'j', uk: 'j', kind: 'consonant', match: 'close', pt: 'Como o "i" rápido de "iogurte". Atenção: no IPA, /j/ é o som de "y" em "yes".',
    examples: [ex('yes', 'jes'), ex('you', 'juː'), ex('year', 'jɪr', 'jɪə')] },
  { id: 'v', us: 'v', uk: 'v', kind: 'consonant', match: 'same', pt: 'Como o "v" de "vaca": os dentes de cima tocam o lábio de baixo.',
    examples: [ex('very', 'ˈveri'), ex('love', 'lʌv'), ex('visit', 'ˈvɪzɪt')],
    tip: 'Não troque por "b": "very" e "berry" (fruta vermelha) são diferentes.' },
  { id: 'p-k', us: 'p t k', uk: 'p t k', kind: 'consonant', match: 'close', pt: 'Como "p", "t" e "k" do português, mas no começo da sílaba forte saem com um sopro de ar.',
    examples: [ex('pen', 'pen'), ex('time', 'taɪm'), ex('car', 'kɑːr', 'kɑː')],
    tip: 'Ponha a mão na frente da boca e diga "pen": dá para sentir o ar.' },
  { id: 's', us: 's', uk: 's', kind: 'consonant', match: 'close', pt: 'Como o "s" de "sapo".',
    examples: [ex('sun', 'sʌn'), ex('school', 'skuːl'), ex('speak', 'spiːk')],
    tip: 'Não ponha um "i" antes de "s" + consoante: "school" não é "iscúl", "speak" não é "ispík".' },
  { id: 'z', us: 'z', uk: 'z', kind: 'consonant', match: 'same', pt: 'Como o "z" de "zebra". Muitos "s" do inglês soam como "z".',
    examples: [ex('zoo', 'zuː'), ex('is', 'ɪz'), ex('dogs', 'dɑːɡz', 'dɒɡz')] },
]

export interface MinimalPair {
  a: string
  b: string
  /** The sounds that make the difference (ids in SOUNDS). */
  sounds: [string, string]
  /** Meaning in Portuguese, so the learner sees why it matters. */
  ptA: string
  ptB: string
}

/** Transcriptions of the minimal-pair words: [US, UK]. */
export const PAIR_IPA: Record<string, [string, string]> = {
  sheep: ['ʃiːp', 'ʃiːp'], ship: ['ʃɪp', 'ʃɪp'], leave: ['liːv', 'liːv'], live: ['lɪv', 'lɪv'],
  seat: ['siːt', 'siːt'], sit: ['sɪt', 'sɪt'], bad: ['bæd', 'bæd'], bed: ['bed', 'bed'],
  man: ['mæn', 'mæn'], men: ['men', 'men'], cap: ['kæp', 'kæp'], cup: ['kʌp', 'kʌp'],
  cat: ['kæt', 'kæt'], cut: ['kʌt', 'kʌt'], full: ['fʊl', 'fʊl'], fool: ['fuːl', 'fuːl'],
  pull: ['pʊl', 'pʊl'], pool: ['puːl', 'puːl'], walk: ['wɔːk', 'wɔːk'], work: ['wɝːk', 'wɜːk'],
  coat: ['koʊt', 'kəʊt'], caught: ['kɔːt', 'kɔːt'], low: ['loʊ', 'ləʊ'], law: ['lɔː', 'lɔː'],
  think: ['θɪŋk', 'θɪŋk'], sink: ['sɪŋk', 'sɪŋk'], three: ['θriː', 'θriː'], tree: ['triː', 'triː'],
  thank: ['θæŋk', 'θæŋk'], tank: ['tæŋk', 'tæŋk'], they: ['ðeɪ', 'ðeɪ'], day: ['deɪ', 'deɪ'],
  then: ['ðen', 'ðen'], den: ['den', 'den'], hat: ['hæt', 'hæt'], at: ['æt', 'æt'],
  heat: ['hiːt', 'hiːt'], eat: ['iːt', 'iːt'], light: ['laɪt', 'laɪt'], right: ['raɪt', 'raɪt'],
  glass: ['ɡlæs', 'ɡlɑːs'], grass: ['ɡræs', 'ɡrɑːs'], very: ['ˈveri', 'ˈveri'], berry: ['ˈberi', 'ˈberi'],
  cheap: ['tʃiːp', 'tʃiːp'], watch: ['wɑːtʃ', 'wɒtʃ'], wash: ['wɑːʃ', 'wɒʃ'],
  sing: ['sɪŋ', 'sɪŋ'], sin: ['sɪn', 'sɪn'], win: ['wɪn', 'wɪn'], wing: ['wɪŋ', 'wɪŋ'],
}

export const pairIpa = (word: string, accent: 'US' | 'UK') => PAIR_IPA[word]?.[accent === 'US' ? 0 : 1]

/** Pairs of words that differ by one sound: the core of ear training. */
export const MINIMAL_PAIRS: MinimalPair[] = [
  { a: 'sheep', b: 'ship', sounds: ['i-long', 'i-short'], ptA: 'ovelha', ptB: 'navio' },
  { a: 'leave', b: 'live', sounds: ['i-long', 'i-short'], ptA: 'sair', ptB: 'morar' },
  { a: 'seat', b: 'sit', sounds: ['i-long', 'i-short'], ptA: 'assento', ptB: 'sentar' },
  { a: 'bad', b: 'bed', sounds: ['ae', 'e'], ptA: 'ruim', ptB: 'cama' },
  { a: 'man', b: 'men', sounds: ['ae', 'e'], ptA: 'homem', ptB: 'homens' },
  { a: 'cap', b: 'cup', sounds: ['ae', 'uh'], ptA: 'boné', ptB: 'xícara' },
  { a: 'cat', b: 'cut', sounds: ['ae', 'uh'], ptA: 'gato', ptB: 'cortar' },
  { a: 'full', b: 'fool', sounds: ['u-short', 'u-long'], ptA: 'cheio', ptB: 'bobo' },
  { a: 'pull', b: 'pool', sounds: ['u-short', 'u-long'], ptA: 'puxar', ptB: 'piscina' },
  { a: 'walk', b: 'work', sounds: ['o-long', 'er'], ptA: 'andar', ptB: 'trabalhar' },
  { a: 'coat', b: 'caught', sounds: ['ou', 'o-long'], ptA: 'casaco', ptB: 'pegou' },
  { a: 'low', b: 'law', sounds: ['ou', 'o-long'], ptA: 'baixo', ptB: 'lei' },
  { a: 'think', b: 'sink', sounds: ['th-voiceless', 's'], ptA: 'pensar', ptB: 'pia' },
  { a: 'three', b: 'tree', sounds: ['th-voiceless', 't-d'], ptA: 'três', ptB: 'árvore' },
  { a: 'thank', b: 'tank', sounds: ['th-voiceless', 't-d'], ptA: 'agradecer', ptB: 'tanque' },
  { a: 'they', b: 'day', sounds: ['th-voiced', 't-d'], ptA: 'eles', ptB: 'dia' },
  { a: 'then', b: 'den', sounds: ['th-voiced', 't-d'], ptA: 'então', ptB: 'toca (de animal)' },
  { a: 'hat', b: 'at', sounds: ['h', 'h'], ptA: 'chapéu', ptB: 'em' },
  { a: 'heat', b: 'eat', sounds: ['h', 'h'], ptA: 'calor', ptB: 'comer' },
  { a: 'light', b: 'right', sounds: ['l', 'r'], ptA: 'luz', ptB: 'certo' },
  { a: 'glass', b: 'grass', sounds: ['l', 'r'], ptA: 'vidro, copo', ptB: 'grama' },
  { a: 'very', b: 'berry', sounds: ['v', 'v'], ptA: 'muito', ptB: 'fruta silvestre' },
  { a: 'cheap', b: 'sheep', sounds: ['ch', 'sh'], ptA: 'barato', ptB: 'ovelha' },
  { a: 'watch', b: 'wash', sounds: ['ch', 'sh'], ptA: 'assistir', ptB: 'lavar' },
  { a: 'sing', b: 'sin', sounds: ['ng', 'ng'], ptA: 'cantar', ptB: 'pecado' },
  { a: 'win', b: 'wing', sounds: ['ng', 'ng'], ptA: 'ganhar', ptB: 'asa' },
]

export function soundById(id: string): Sound | undefined {
  return SOUNDS.find((s) => s.id === id)
}
