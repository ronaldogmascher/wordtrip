// Grammar ("function") words: pronouns, articles, prepositions, conjunctions, auxiliaries…
// WordNet only covers nouns, verbs, adjectives and adverbs, so these short entries (original
// content written for WordTrip) fill the gap in the dictionary popup.

export interface FunctionWord {
  /** Grammar class, in Portuguese. */
  kind: string
  /** Short explanation in English. */
  definition: string
  /** Portuguese equivalent(s). */
  pt: string
  example: string
}

const w = (kind: string, definition: string, pt: string, example: string): FunctionWord => ({ kind, definition, pt, example })

const PRON = 'pronome'
const DET = 'determinante'
const PREP = 'preposição'
const CONJ = 'conjunção'
const AUX = 'verbo auxiliar'
const MODAL = 'verbo modal'
const Q = 'palavra interrogativa'

export const FUNCTION_WORDS: Record<string, FunctionWord> = {
  // Pronouns
  i: w(PRON, 'the person speaking', 'eu', 'I live in Brazil.'),
  me: w(PRON, 'the person speaking, as the object of a verb or preposition', 'me, mim', 'Can you help me?'),
  my: w(DET, 'belonging to the person speaking', 'meu, minha', 'This is my car.'),
  mine: w(PRON, 'the one that belongs to the person speaking', 'o meu, a minha', 'That bag is mine.'),
  myself: w(PRON, 'the person speaking, when they are also the object', 'eu mesmo, me', 'I cut myself.'),
  you: w(PRON, 'the person or people being spoken to', 'você, vocês, te', 'Do you like coffee?'),
  your: w(DET, 'belonging to the person or people being spoken to', 'seu, sua, de vocês', 'Is this your phone?'),
  yours: w(PRON, 'the one that belongs to the person spoken to', 'o seu, a sua', 'Is this pen yours?'),
  he: w(PRON, 'a man, boy or male animal already mentioned', 'ele', 'He is my brother.'),
  him: w(PRON, 'a man or boy, as the object of a verb or preposition', 'o, lhe, ele', 'I saw him yesterday.'),
  his: w(DET, 'belonging to a man or boy', 'dele, seu, sua', 'His name is Pedro.'),
  she: w(PRON, 'a woman, girl or female animal already mentioned', 'ela', 'She works at a bank.'),
  her: w(PRON, 'a woman or girl (object), or belonging to her', 'a, lhe, ela; dela', 'I called her. Her house is big.'),
  hers: w(PRON, 'the one that belongs to a woman or girl', 'o dela, a dela', 'The red bag is hers.'),
  it: w(PRON, 'a thing, animal or situation already mentioned', 'ele, ela, isso (ou sem tradução)', 'It is raining.'),
  its: w(DET, 'belonging to a thing or animal', 'seu, sua, dele, dela', 'The dog wagged its tail.'),
  we: w(PRON, 'the speaker and one or more other people', 'nós', 'We are going to the beach.'),
  us: w(PRON, 'the speaker and others, as the object', 'nos, nós', 'Come with us!'),
  our: w(DET, 'belonging to the speaker and others', 'nosso, nossa', 'Our motorhome is white.'),
  ours: w(PRON, 'the one that belongs to us', 'o nosso, a nossa', 'That table is ours.'),
  they: w(PRON, 'two or more people or things already mentioned', 'eles, elas', 'They live in Rio.'),
  them: w(PRON, 'two or more people or things, as the object', 'os, as, eles, elas', 'I love them.'),
  their: w(DET, 'belonging to them', 'deles, delas, seu, sua', 'Their kids are at school.'),
  theirs: w(PRON, 'the one that belongs to them', 'o deles, a delas', 'The blue car is theirs.'),
  this: w(DET, 'the person or thing near you', 'este, esta, isto', 'This coffee is hot.'),
  that: w(DET, 'the person or thing farther away; also joins two parts of a sentence', 'aquele, aquilo, esse; que', 'I know that you are right.'),
  these: w(DET, 'the people or things near you (plural)', 'estes, estas', 'These shoes are new.'),
  those: w(DET, 'the people or things farther away (plural)', 'aqueles, aquelas', 'Look at those birds!'),
  something: w(PRON, 'a thing that is not named or not known', 'algo, alguma coisa', 'I want to eat something.'),
  anything: w(PRON, 'any thing at all (in questions and negatives)', 'algo, qualquer coisa, nada', 'Do you need anything?'),
  nothing: w(PRON, 'not anything; no thing', 'nada', 'There is nothing in the box.'),
  everything: w(PRON, 'all things', 'tudo', 'Everything is ready.'),
  someone: w(PRON, 'a person who is not named or not known', 'alguém', 'Someone is at the door.'),
  somebody: w(PRON, 'a person who is not named or not known', 'alguém', 'Somebody called you.'),
  anyone: w(PRON, 'any person at all (in questions and negatives)', 'alguém, ninguém, qualquer um', 'Is anyone here?'),
  anybody: w(PRON, 'any person at all', 'alguém, ninguém', 'Does anybody speak English?'),
  everyone: w(PRON, 'all people', 'todos, todo mundo', 'Everyone loves music.'),
  everybody: w(PRON, 'all people', 'todos, todo mundo', 'Hello, everybody!'),
  nobody: w(PRON, 'no person', 'ninguém', 'Nobody knows the answer.'),
  somewhere: w('advérbio', 'in or to a place that is not named', 'em algum lugar', 'Let’s go somewhere quiet.'),
  everywhere: w('advérbio', 'in or to all places', 'em todo lugar', 'There are tourists everywhere.'),
  // Articles and determiners
  a: w('artigo', 'one; used before a singular noun that starts with a consonant sound', 'um, uma', 'I have a dog.'),
  an: w('artigo', 'one; used before a singular noun that starts with a vowel sound', 'um, uma', 'She ate an apple.'),
  the: w('artigo', 'used before a noun when it is clear which one you mean', 'o, a, os, as', 'The sun is hot.'),
  some: w(DET, 'an amount or number that is not exact', 'algum, alguns, um pouco de', 'I want some water.'),
  any: w(DET, 'one, some or all, it doesn’t matter which (in questions and negatives)', 'algum, nenhum, qualquer', 'Do you have any money?'),
  no: w(DET, 'not any; also the opposite of yes', 'nenhum; não', 'There is no milk.'),
  every: w(DET, 'all the members of a group, one by one', 'todo, toda, cada', 'I run every day.'),
  each: w(DET, 'every one of two or more, seen separately', 'cada', 'Each room has a bathroom.'),
  all: w(DET, 'the whole amount or number', 'todo, todos, tudo', 'All my friends are here.'),
  both: w(DET, 'the two together', 'ambos, os dois', 'Both hotels are good.'),
  other: w(DET, 'different from the one already mentioned', 'outro, outra', 'The other bus is faster.'),
  another: w(DET, 'one more; a different one', 'outro, outra, mais um', 'Can I have another coffee?'),
  // Prepositions
  of: w(PREP, 'belonging to, part of, or about something', 'de', 'A cup of tea.'),
  in: w(PREP, 'inside a place, period of time or situation', 'em, dentro de', 'She lives in São Paulo.'),
  on: w(PREP, 'touching the top surface of something; also used with days', 'em, sobre, em cima de', 'The book is on the table.'),
  at: w(PREP, 'used to show an exact place or time', 'em, às', 'Meet me at 8 o’clock.'),
  to: w(PREP, 'in the direction of; also used before a verb', 'para, a', 'We are going to the beach.'),
  for: w(PREP, 'intended to be given to or used by; also used with periods of time', 'para, por, durante', 'This gift is for you.'),
  from: w(PREP, 'showing where something starts or comes from', 'de, desde', 'I am from Brazil.'),
  with: w(PREP, 'together with someone or something; using something', 'com', 'I live with my family.'),
  without: w(PREP, 'not having or not using something', 'sem', 'Coffee without sugar, please.'),
  by: w(PREP, 'near; also shows who did something or how', 'por, perto de, de', 'We went by car.'),
  about: w(PREP, 'on the subject of; also approximately', 'sobre; mais ou menos', 'A book about Brazil.'),
  into: w(PREP, 'moving to the inside of something', 'para dentro de', 'She jumped into the pool.'),
  over: w(PREP, 'above something; also more than', 'sobre, por cima de; mais de', 'A bridge over the river.'),
  under: w(PREP, 'below something', 'embaixo de, sob', 'The cat is under the bed.'),
  between: w(PREP, 'in the space that separates two things', 'entre', 'The bank is between the two shops.'),
  after: w(PREP, 'later than something', 'depois de, após', 'Let’s swim after lunch.'),
  before: w(PREP, 'earlier than something', 'antes de', 'Wash your hands before dinner.'),
  during: w(PREP, 'from the beginning to the end of a period of time', 'durante', 'It rained during the night.'),
  until: w(PREP, 'up to a particular time', 'até', 'The shop is open until ten.'),
  through: w(PREP, 'from one side or end to the other', 'através de, por', 'We drove through the city.'),
  near: w(PREP, 'a short distance from', 'perto de', 'Our hotel is near the beach.'),
  behind: w(PREP, 'at the back of', 'atrás de', 'The park is behind the school.'),
  // Conjunctions
  and: w(CONJ, 'used to join words or ideas that go together', 'e', 'Rice and beans.'),
  or: w(CONJ, 'used to show a choice', 'ou', 'Tea or coffee?'),
  but: w(CONJ, 'used to show a contrast', 'mas', 'It is cheap but good.'),
  because: w(CONJ, 'for the reason that', 'porque', 'I’m tired because I worked a lot.'),
  so: w(CONJ, 'and for this reason; also very', 'então, por isso; tão', 'It was late, so we left.'),
  if: w(CONJ, 'used to talk about a possible situation', 'se', 'If it rains, we stay home.'),
  when: w(CONJ, 'at the time that; also asks about time', 'quando', 'Call me when you arrive.'),
  while: w(CONJ, 'during the time that', 'enquanto', 'I listen to music while I cook.'),
  than: w(CONJ, 'used to compare two things', 'do que', 'Rio is hotter than London.'),
  though: w(CONJ, 'despite the fact that', 'embora, apesar de', 'Though it was cold, we swam.'),
  although: w(CONJ, 'despite the fact that', 'embora', 'Although it’s far, it’s worth it.'),
  // Question words
  what: w(Q, 'asks about a thing or information', 'o que, qual', 'What is your name?'),
  who: w(Q, 'asks about a person', 'quem', 'Who is that man?'),
  where: w(Q, 'asks about a place', 'onde', 'Where do you live?'),
  why: w(Q, 'asks about a reason', 'por que', 'Why are you sad?'),
  how: w(Q, 'asks about the way something happens or its condition', 'como', 'How are you?'),
  which: w(Q, 'asks someone to choose from a group', 'qual, quais', 'Which bus goes downtown?'),
  whose: w(Q, 'asks who something belongs to', 'de quem', 'Whose bag is this?'),
  // Auxiliaries and modals
  is: w(AUX, 'form of "be" used with he, she, it', 'é, está', 'She is happy.'),
  am: w(AUX, 'form of "be" used with I', 'sou, estou', 'I am a teacher.'),
  are: w(AUX, 'form of "be" used with you, we, they', 'é, são, está, estão', 'They are friends.'),
  was: w(AUX, 'past of "be" with I, he, she, it', 'era, estava, foi', 'It was a great day.'),
  were: w(AUX, 'past of "be" with you, we, they', 'eram, estavam, foram', 'We were at home.'),
  does: w(AUX, 'form of "do" used with he, she, it in questions and negatives', '(auxiliar de pergunta/negação)', 'Does she speak English?'),
  did: w(AUX, 'past of "do", used in questions and negatives', '(auxiliar do passado)', 'Did you sleep well?'),
  will: w(MODAL, 'used to talk about the future', '(futuro: vou, vai…)', 'I will call you tomorrow.'),
  would: w(MODAL, 'used for polite requests and imaginary situations', '(futuro do pretérito: -ria)', 'I would like a coffee.'),
  can: w(MODAL, 'to be able to or allowed to', 'poder, conseguir, saber', 'I can swim.'),
  could: w(MODAL, 'past of "can"; also a polite request or possibility', 'podia, poderia, conseguiu', 'Could you help me?'),
  should: w(MODAL, 'used to give advice', 'deveria', 'You should drink more water.'),
  must: w(MODAL, 'used to say something is necessary', 'dever, ter que', 'You must wear a seat belt.'),
  may: w(MODAL, 'used to say something is possible or to ask permission', 'poder (talvez)', 'May I come in?'),
  might: w(MODAL, 'used to say something is possible but not certain', 'talvez, poderia', 'It might rain later.'),
  // Common small words
  not: w('advérbio', 'used to make a sentence negative', 'não', 'I am not tired.'),
  yes: w('interjeição', 'used to agree or say something is true', 'sim', 'Yes, I understand.'),
  too: w('advérbio', 'also; or more than is good', 'também; demais', 'I like it too. It’s too hot.'),
  also: w('advérbio', 'in addition', 'também', 'She also speaks Spanish.'),
  just: w('advérbio', 'only; or a very short time ago', 'só, apenas; acabou de', 'I just arrived.'),
  only: w('advérbio', 'no more than; nobody or nothing else', 'só, somente, apenas', 'I have only ten reais.'),
}

export function functionWord(word: string): FunctionWord | undefined {
  return Object.hasOwn(FUNCTION_WORDS, word) ? FUNCTION_WORDS[word] : undefined
}
