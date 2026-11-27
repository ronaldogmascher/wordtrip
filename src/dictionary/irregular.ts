// Irregular English forms → base form, used to find a word in the dictionary
// ("went" → "go", "children" → "child"). Regular forms are handled by rules in lemmatize.ts.

// base past participle (alternatives separated by "/")
const VERBS = `
arise arose arisen
awake awoke awoken
be was/were been
bear bore borne/born
beat beat beaten
become became become
begin began begun
bend bent bent
bet bet bet
bind bound bound
bite bit bitten
bleed bled bled
blow blew blown
break broke broken
breed bred bred
bring brought brought
build built built
burn burnt burnt
burst burst burst
buy bought bought
catch caught caught
choose chose chosen
cling clung clung
come came come
cost cost cost
creep crept crept
cut cut cut
deal dealt dealt
dig dug dug
do did done
draw drew drawn
dream dreamt dreamt
drink drank drunk
drive drove driven
eat ate eaten
fall fell fallen
feed fed fed
feel felt felt
fight fought fought
find found found
flee fled fled
fly flew flown
forbid forbade forbidden
forget forgot forgotten
forgive forgave forgiven
freeze froze frozen
get got gotten/got
give gave given
go went gone
grind ground ground
grow grew grown
hang hung hung
have had had
hear heard heard
hide hid hidden
hit hit hit
hold held held
hurt hurt hurt
keep kept kept
kneel knelt knelt
know knew known
lay laid laid
lead led led
lean leant leant
leap leapt leapt
learn learnt learnt
leave left left
lend lent lent
let let let
lie lay lain
light lit lit
lose lost lost
make made made
mean meant meant
meet met met
pay paid paid
put put put
quit quit quit
read read read
ride rode ridden
ring rang rung
rise rose risen
run ran run
say said said
see saw seen
seek sought sought
sell sold sold
send sent sent
set set set
shake shook shaken
shine shone shone
shoot shot shot
show showed shown
shrink shrank shrunk
shut shut shut
sing sang sung
sink sank sunk
sit sat sat
sleep slept slept
slide slid slid
speak spoke spoken
speed sped sped
spell spelt spelt
spend spent spent
spill spilt spilt
spin spun spun
spit spat spat
split split split
spread spread spread
spring sprang sprung
stand stood stood
steal stole stolen
stick stuck stuck
sting stung stung
stink stank stunk
strike struck struck
swear swore sworn
sweep swept swept
swim swam swum
swing swung swung
take took taken
teach taught taught
tear tore torn
tell told told
think thought thought
throw threw thrown
understand understood understood
wake woke woken
wear wore worn
weep wept wept
win won won
wind wound wound
write wrote written
`

const OTHERS: Record<string, string> = {
  // nouns
  children: 'child',
  men: 'man',
  women: 'woman',
  people: 'person',
  feet: 'foot',
  teeth: 'tooth',
  mice: 'mouse',
  geese: 'goose',
  lives: 'life',
  wives: 'wife',
  knives: 'knife',
  leaves: 'leaf',
  halves: 'half',
  shelves: 'shelf',
  // adjectives and adverbs
  better: 'good',
  best: 'good',
  worse: 'bad',
  worst: 'bad',
  further: 'far',
  farther: 'far',
  furthest: 'far',
  less: 'little',
  least: 'little',
  more: 'much',
  most: 'much',
  // verb forms
  is: 'be',
  am: 'be',
  are: 'be',
  has: 'have',
  does: 'do',
}

/** Irregular form → base forms (a form can have more than one base, e.g. "lay" → lie, lay). */
export const IRREGULAR = new Map<string, string[]>()

function add(form: string, base: string) {
  if (form === base) return
  const list = IRREGULAR.get(form) ?? []
  if (!list.includes(base)) list.push(base)
  IRREGULAR.set(form, list)
}

for (const line of VERBS.trim().split('\n')) {
  const [base, past, participle] = line.split(' ')
  for (const form of [...past.split('/'), ...participle.split('/')]) add(form, base)
}
for (const [form, base] of Object.entries(OTHERS)) add(form, base)
