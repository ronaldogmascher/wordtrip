// Pronunciation (IPA) of every Autoescola item, American and British.
// A single string means both accents say it the same way.
import type { Accent } from '../db/db.ts'

type Ipa = string | [us: string, uk: string]

const LETTERS: Record<string, Ipa> = {
  A: 'eɪ', B: 'biː', C: 'siː', D: 'diː', E: 'iː', F: 'ɛf', G: 'dʒiː', H: 'eɪtʃ', I: 'aɪ', J: 'dʒeɪ',
  K: 'keɪ', L: 'ɛl', M: 'ɛm', N: 'ɛn', O: 'oʊ', P: 'piː', Q: 'kjuː', R: ['ɑːr', 'ɑː'], S: 'ɛs', T: 'tiː',
  U: 'juː', V: 'viː', W: 'ˈdʌbəljuː', X: 'ɛks', Y: 'waɪ', Z: ['ziː', 'zɛd'],
}

const WORDS: Record<string, Ipa> = {
  // greetings
  hello: ['həˈloʊ', 'həˈləʊ'], hi: 'haɪ', 'good morning': ['ɡʊd ˈmɔːrnɪŋ', 'ɡʊd ˈmɔːnɪŋ'],
  'good afternoon': ['ɡʊd ˌæftərˈnuːn', 'ɡʊd ˌɑːftəˈnuːn'], 'good evening': 'ɡʊd ˈiːvnɪŋ', 'good night': 'ɡʊd naɪt',
  goodbye: 'ɡʊdˈbaɪ', 'see you later': ['siː juː ˈleɪtər', 'siː juː ˈleɪtə'], please: 'pliːz', 'thank you': 'ˈθæŋk juː',
  sorry: ['ˈsɑːri', 'ˈsɒri'], 'excuse me': 'ɪkˈskjuːz miː', yes: 'jɛs', no: ['noʊ', 'nəʊ'],
  'how are you?': ['haʊ ɑːr juː', 'haʊ ɑː juː'], 'nice to meet you': 'naɪs tə miːt juː', 'my name is…': 'maɪ neɪm ɪz',
  "you're welcome": ['jʊr ˈwɛlkəm', 'jɔː ˈwɛlkəm'], "I'm fine": 'aɪm faɪn', "what's your name?": ['wʌts jʊr neɪm', 'wɒts jɔː neɪm'],
  "I'm not": ['aɪm nɑːt', 'aɪm nɒt'], "I don't understand": ['aɪ doʊnt ˌʌndərˈstænd', 'aɪ dəʊnt ˌʌndəˈstænd'],
  // numbers
  zero: ['ˈzɪroʊ', 'ˈzɪərəʊ'], one: 'wʌn', two: 'tuː', three: 'θriː', four: ['fɔːr', 'fɔː'], five: 'faɪv', six: 'sɪks',
  seven: 'ˈsɛvən', eight: 'eɪt', nine: 'naɪn', ten: 'tɛn', eleven: 'ɪˈlɛvən', twelve: 'twɛlv',
  thirteen: ['ˌθɜːrˈtiːn', 'ˌθɜːˈtiːn'], fourteen: ['ˌfɔːrˈtiːn', 'ˌfɔːˈtiːn'], fifteen: 'ˌfɪfˈtiːn', sixteen: 'ˌsɪksˈtiːn',
  seventeen: 'ˌsɛvənˈtiːn', eighteen: 'ˌeɪˈtiːn', nineteen: 'ˌnaɪnˈtiːn', twenty: ['ˈtwɛnti', 'ˈtwɛnti'],
  thirty: ['ˈθɜːrti', 'ˈθɜːti'], forty: ['ˈfɔːrti', 'ˈfɔːti'], fifty: 'ˈfɪfti', sixty: 'ˈsɪksti', seventy: 'ˈsɛvənti',
  eighty: 'ˈeɪti', ninety: 'ˈnaɪnti', 'one hundred': 'wʌn ˈhʌndrəd',
  // to be
  I: 'aɪ', you: 'juː', he: 'hiː', she: 'ʃiː', it: 'ɪt', we: 'wiː', they: 'ðeɪ',
  'I am': 'aɪ æm', 'you are': ['juː ɑːr', 'juː ɑː'], 'he is': 'hiː ɪz', 'she is': 'ʃiː ɪz', 'it is': 'ɪt ɪz',
  'we are': ['wiː ɑːr', 'wiː ɑː'], 'they are': ['ðeɪ ɑːr', 'ðeɪ ɑː'], 'are you…?': ['ɑːr juː', 'ɑː juː'],
  // colors
  red: 'rɛd', blue: 'bluː', green: 'ɡriːn', yellow: ['ˈjɛloʊ', 'ˈjɛləʊ'], black: 'blæk', white: 'waɪt',
  orange: ['ˈɔːrɪndʒ', 'ˈɒrɪndʒ'], purple: ['ˈpɜːrpəl', 'ˈpɜːpəl'], brown: 'braʊn', pink: 'pɪŋk', gray: 'ɡreɪ',
  // family
  mother: ['ˈmʌðər', 'ˈmʌðə'], father: ['ˈfɑːðər', 'ˈfɑːðə'], brother: ['ˈbrʌðər', 'ˈbrʌðə'], sister: ['ˈsɪstər', 'ˈsɪstə'],
  son: 'sʌn', daughter: ['ˈdɔːtər', 'ˈdɔːtə'], husband: 'ˈhʌzbənd', wife: 'waɪf',
  grandmother: ['ˈɡrænˌmʌðər', 'ˈɡrænˌmʌðə'], grandfather: ['ˈɡrænˌfɑːðər', 'ˈɡrænˌfɑːðə'], baby: 'ˈbeɪbi',
  friend: 'frɛnd', man: 'mæn', woman: 'ˈwʊmən', child: 'tʃaɪld',
  // home and things
  house: 'haʊs', door: ['dɔːr', 'dɔː'], window: ['ˈwɪndoʊ', 'ˈwɪndəʊ'], bed: 'bɛd', table: 'ˈteɪbəl',
  chair: ['tʃɛr', 'tʃeə'], phone: ['foʊn', 'fəʊn'], book: 'bʊk', car: ['kɑːr', 'kɑː'], key: 'kiː', bag: 'bæɡ',
  computer: ['kəmˈpjuːtər', 'kəmˈpjuːtə'], money: 'ˈmʌni', clock: ['klɑːk', 'klɒk'], shoes: 'ʃuːz',
  // food
  water: ['ˈwɔːtər', 'ˈwɔːtə'], coffee: ['ˈkɔːfi', 'ˈkɒfi'], milk: 'mɪlk', juice: 'dʒuːs', beer: ['bɪr', 'bɪə'],
  bread: 'brɛd', egg: 'ɛɡ', rice: 'raɪs', beans: 'biːnz', meat: 'miːt', chicken: 'ˈtʃɪkɪn', fish: 'fɪʃ',
  apple: 'ˈæpəl', banana: ['bəˈnænə', 'bəˈnɑːnə'], cheese: 'tʃiːz',
  // time
  Monday: 'ˈmʌndeɪ', Tuesday: ['ˈtuːzdeɪ', 'ˈtjuːzdeɪ'], Wednesday: 'ˈwɛnzdeɪ', Thursday: ['ˈθɜːrzdeɪ', 'ˈθɜːzdeɪ'],
  Friday: 'ˈfraɪdeɪ', Saturday: ['ˈsætərdeɪ', 'ˈsætədeɪ'], Sunday: 'ˈsʌndeɪ',
  January: ['ˈdʒænjuˌɛri', 'ˈdʒænjuəri'], February: ['ˈfɛbruˌɛri', 'ˈfɛbruəri'], March: ['mɑːrtʃ', 'mɑːtʃ'],
  April: 'ˈeɪprəl', May: 'meɪ', June: 'dʒuːn', July: 'dʒuˈlaɪ', August: ['ˈɑːɡəst', 'ˈɔːɡəst'],
  September: ['sɛpˈtɛmbər', 'sɛpˈtɛmbə'], October: ['ɑːkˈtoʊbər', 'ɒkˈtəʊbə'], November: ['noʊˈvɛmbər', 'nəʊˈvɛmbə'],
  December: ['dɪˈsɛmbər', 'dɪˈsɛmbə'], today: 'təˈdeɪ', tomorrow: ['təˈmɑːroʊ', 'təˈmɒrəʊ'], yesterday: ['ˈjɛstərdeɪ', 'ˈjɛstədeɪ'],
  // questions
  what: ['wʌt', 'wɒt'], where: ['wɛr', 'weə'], who: 'huː', when: 'wɛn', why: 'waɪ', how: 'haʊ',
  'how much': 'haʊ mʌtʃ', 'how many': 'haʊ ˈmɛni', which: 'wɪtʃ',
  'where is the bathroom?': ['wɛr ɪz ðə ˈbæθruːm', 'weər ɪz ðə ˈbɑːθruːm'], 'how much is it?': 'haʊ mʌtʃ ɪz ɪt',
  'what time is it?': ['wʌt taɪm ɪz ɪt', 'wɒt taɪm ɪz ɪt'], 'do you speak English?': 'duː juː spiːk ˈɪŋɡlɪʃ',
}

/** The item's pronunciation between slashes in the chosen accent, or undefined if we don't have it. */
export function schoolIpa(en: string, accent: Accent): string | undefined {
  const ipa = en.length === 1 ? LETTERS[en] : WORDS[en]
  if (!ipa) return undefined
  return `/${typeof ipa === 'string' ? ipa : ipa[accent === 'UK' ? 1 : 0]}/`
}
