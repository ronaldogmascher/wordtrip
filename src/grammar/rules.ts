// "Regrinhas": small grammar choices that Brazilians often mix up (in/on/at, a/an, the with
// countries…). Hand-written sentences with translations, answered by choosing.

export type RuleTopic = 'prep-time' | 'prep-place' | 'a-an' | 'the-places' | 'much-many' | 'for-since' | 'make-do' | 'say-tell'

/** Shown instead of a word when the right answer is "no word at all". */
export const NOTHING = '(nada)'

export interface RuleInfo {
  id: RuleTopic
  label: string
  icon: string
  rule: string
  options: string[]
}

export const RULE_TOPICS: RuleInfo[] = [
  {
    id: 'prep-time', label: 'in / on / at (tempo)', icon: '⏰', options: ['in', 'on', 'at'],
    rule: 'at para horas e momentos (at 7, at night); on para dias e datas (on Monday, on May 5th); in para meses, anos, estações e partes do dia (in July, in 2026, in the morning).',
  },
  {
    id: 'prep-place', label: 'in / on / at (lugar)', icon: '📍', options: ['in', 'on', 'at'],
    rule: 'in para dentro de algo ou cidades e países (in the car, in Rio); on para superfícies, ruas e transportes grandes (on the table, on the bus); at para pontos e endereços (at the airport, at 10 Main Street).',
  },
  {
    id: 'a-an', label: 'a / an', icon: '🔤', options: ['a', 'an'],
    rule: 'Depende do SOM, não da letra: an antes de som de vogal (an hour, an apple), a antes de som de consoante (a university, a car).',
  },
  {
    id: 'the-places', label: 'the com países e lugares', icon: '🌎', options: ['the', NOTHING],
    rule: 'Países e cidades normalmente não levam the (Brazil, Paris). Levam the: nomes com republic, kingdom, states (the United States, the UK), plurais (the Philippines), oceanos, rios e cadeias de montanhas (the Amazon, the Andes).',
  },
  {
    id: 'much-many', label: 'much / many', icon: '🔢', options: ['much', 'many'],
    rule: 'many com coisas contáveis no plural (many friends); much com incontáveis (much water, much money). Em frases afirmativas, a lot of serve para os dois.',
  },
  {
    id: 'for-since', label: 'for / since', icon: '⏳', options: ['for', 'since'],
    rule: 'for + período de tempo (for two years, for a week); since + ponto de início (since 2020, since Monday).',
  },
  {
    id: 'make-do', label: 'make / do', icon: '🛠️', options: ['make', 'do'],
    rule: 'make para criar ou produzir algo (make a cake, make a plan, make a mistake); do para tarefas e atividades (do homework, do the dishes, do exercise).',
  },
  {
    id: 'say-tell', label: 'say / tell', icon: '💬', options: ['say', 'tell'],
    rule: 'tell pede a pessoa logo depois (tell me, tell her the truth); say não (say hello, say something to her).',
  },
]

export interface RuleSentence {
  text: string
  answer: string
  pt: string
}

const s = (text: string, answer: string, pt: string): RuleSentence => ({ text, answer, pt })

export const RULE_SENTENCES: Record<RuleTopic, RuleSentence[]> = {
  'prep-time': [
    s('The bus leaves ____ 7 o’clock.', 'at', 'O ônibus sai às 7 horas.'),
    s('We arrive in Salvador ____ Monday.', 'on', 'Chegamos a Salvador na segunda-feira.'),
    s('It is very hot in Manaus ____ December.', 'in', 'Faz muito calor em Manaus em dezembro.'),
    s('The museum is closed ____ night.', 'at', 'O museu fica fechado à noite.'),
    s('I was born ____ 1990.', 'in', 'Eu nasci em 1990.'),
    s('The party is ____ May 5th.', 'on', 'A festa é no dia 5 de maio.'),
    s('We always go to the beach ____ the morning.', 'in', 'Sempre vamos à praia de manhã.'),
    s('The shops open late ____ Sundays.', 'on', 'As lojas abrem tarde aos domingos.'),
    s('Let’s meet ____ noon.', 'at', 'Vamos nos encontrar ao meio-dia.'),
    s('Many tourists visit Bonito ____ the summer.', 'in', 'Muitos turistas visitam Bonito no verão.'),
    s('What do you do ____ the weekend?', 'on', 'O que você faz no fim de semana? (no inglês britânico também se diz at the weekend)'),
    s('The flight lands ____ 10:30.', 'at', 'O voo pousa às 10:30.'),
  ],
  'prep-place': [
    s('My passport is ____ my bag.', 'in', 'Meu passaporte está na minha bolsa.'),
    s('The keys are ____ the table.', 'on', 'As chaves estão na mesa.'),
    s('I will wait for you ____ the airport.', 'at', 'Vou te esperar no aeroporto.'),
    s('We live ____ Santo André.', 'in', 'Moramos em Santo André.'),
    s('There is a nice café ____ Paulista Avenue.', 'on', 'Tem um café legal na Avenida Paulista.'),
    s('She is ____ the bus now.', 'on', 'Ela está no ônibus agora.'),
    s('He is sitting ____ the car.', 'in', 'Ele está sentado no carro.'),
    s('Turn left ____ the traffic lights.', 'at', 'Vire à esquerda no semáforo.'),
    s('There is a picture ____ the wall.', 'on', 'Tem um quadro na parede.'),
    s('The kids are ____ school.', 'at', 'As crianças estão na escola.'),
    s('Iguazu Falls is ____ Brazil and Argentina.', 'in', 'As Cataratas do Iguaçu ficam no Brasil e na Argentina.'),
    s('We stopped ____ a gas station.', 'at', 'Paramos num posto de gasolina.'),
  ],
  'a-an': [
    s('I need ____ umbrella.', 'an', 'Preciso de um guarda-chuva.'),
    s('We waited for ____ hour.', 'an', 'Esperamos uma hora. (o h de hour não tem som)'),
    s('She studies at ____ university in Rio.', 'a', 'Ela estuda numa universidade no Rio. (university começa com som de "iu")'),
    s('It was ____ amazing trip.', 'an', 'Foi uma viagem incrível.'),
    s('He is ____ honest man.', 'an', 'Ele é um homem honesto. (o h de honest não tem som)'),
    s('I want ____ cold drink.', 'a', 'Quero uma bebida gelada.'),
    s('There is ____ old church in Ouro Preto.', 'an', 'Tem uma igreja antiga em Ouro Preto.'),
    s('We saw ____ European couple on the boat.', 'a', 'Vimos um casal europeu no barco. (European começa com som de "iu")'),
    s('Can I have ____ orange juice?', 'an', 'Pode me ver um suco de laranja?'),
    s('This is ____ one-way street.', 'a', 'Esta é uma rua de mão única. (one começa com som de "uã")'),
    s('She found ____ hotel near the beach.', 'a', 'Ela achou um hotel perto da praia.'),
    s('I have ____ idea!', 'an', 'Tenho uma ideia!'),
  ],
  'the-places': [
    s('We are driving to ____ Argentina.', NOTHING, 'Estamos dirigindo para a Argentina.'),
    s('Our trip ends in ____ United States.', 'the', 'Nossa viagem termina nos Estados Unidos.'),
    s('____ Amazon is the largest rainforest in the world.', 'the', 'A Amazônia é a maior floresta tropical do mundo.'),
    s('I would love to visit ____ Japan.', NOTHING, 'Eu adoraria visitar o Japão.'),
    s('She lives in ____ UK.', 'the', 'Ela mora no Reino Unido.'),
    s('We crossed ____ Andes by bus.', 'the', 'Atravessamos os Andes de ônibus.'),
    s('____ Brazil is the biggest country in South America.', NOTHING, 'O Brasil é o maior país da América do Sul.'),
    s('They went on vacation to ____ Philippines.', 'the', 'Eles foram de férias para as Filipinas.'),
    s('____ New York is called the Big Apple.', NOTHING, 'Nova York é chamada de Big Apple.'),
    s('Many ships cross ____ Atlantic Ocean.', 'the', 'Muitos navios atravessam o Oceano Atlântico.'),
    s('My cousin moved to ____ Mexico.', NOTHING, 'Meu primo se mudou para o México.'),
    s('We swam in ____ Paraná River.', 'the', 'Nadamos no Rio Paraná.'),
  ],
  'much-many': [
    s('How ____ money do you have?', 'much', 'Quanto dinheiro você tem?'),
    s('How ____ people are on the bus?', 'many', 'Quantas pessoas estão no ônibus?'),
    s('There aren’t ____ tourists in May.', 'many', 'Não tem muitos turistas em maio.'),
    s('I don’t drink ____ coffee.', 'much', 'Não bebo muito café.'),
    s('We don’t have ____ time.', 'much', 'Não temos muito tempo.'),
    s('How ____ days will you stay?', 'many', 'Quantos dias você vai ficar?'),
    s('There isn’t ____ water in the river now.', 'much', 'Não tem muita água no rio agora.'),
    s('She has ____ friends in Rio.', 'many', 'Ela tem muitos amigos no Rio.'),
    s('How ____ is this hat?', 'much', 'Quanto custa este chapéu?'),
    s('I didn’t take ____ photos.', 'many', 'Não tirei muitas fotos.'),
    s('Is there ____ traffic today?', 'much', 'Tem muito trânsito hoje?'),
    s('How ____ bags do you have?', 'many', 'Quantas malas você tem?'),
  ],
  'for-since': [
    s('I have lived here ____ ten years.', 'for', 'Moro aqui há dez anos.'),
    s('She has worked at the bank ____ 2019.', 'since', 'Ela trabalha no banco desde 2019.'),
    s('We have been on the road ____ two weeks.', 'for', 'Estamos na estrada há duas semanas.'),
    s('It has rained ____ Monday.', 'since', 'Chove desde segunda-feira.'),
    s('I have known him ____ we were kids.', 'since', 'Eu o conheço desde que éramos crianças.'),
    s('They waited ____ an hour.', 'for', 'Eles esperaram por uma hora.'),
    s('He has studied English ____ January.', 'since', 'Ele estuda inglês desde janeiro.'),
    s('We stayed in Bonito ____ three days.', 'for', 'Ficamos em Bonito por três dias.'),
    s('I haven’t seen her ____ last summer.', 'since', 'Não a vejo desde o verão passado.'),
    s('The store has been closed ____ a month.', 'for', 'A loja está fechada há um mês.'),
  ],
  'make-do': [
    s('Can you ____ me a favor?', 'do', 'Você pode me fazer um favor?'),
    s('Let’s ____ a plan for the trip.', 'make', 'Vamos fazer um plano para a viagem.'),
    s('I need to ____ my homework.', 'do', 'Preciso fazer minha lição de casa.'),
    s('Don’t worry, everybody can ____ a mistake.', 'make', 'Não se preocupe, todo mundo pode cometer um erro.'),
    s('Who will ____ the dishes tonight?', 'do', 'Quem vai lavar a louça hoje à noite?'),
    s('She wants to ____ a cake for the party.', 'make', 'Ela quer fazer um bolo para a festa.'),
    s('I ____ exercise every morning.', 'do', 'Faço exercício toda manhã.'),
    s('Please don’t ____ noise. The baby is sleeping.', 'make', 'Por favor, não faça barulho. O bebê está dormindo.'),
    s('We have to ____ a decision today.', 'make', 'Temos que tomar uma decisão hoje.'),
    s('He wants to ____ business in Manaus.', 'do', 'Ele quer fazer negócios em Manaus.'),
    s('Can I ____ a phone call?', 'make', 'Posso fazer uma ligação?'),
    s('Just ____ your best.', 'do', 'Apenas faça o seu melhor.'),
  ],
  'say-tell': [
    s('Can you ____ me the way to the beach?', 'tell', 'Você pode me dizer o caminho para a praia?'),
    s('____ hello to your family!', 'say', 'Mande um oi para sua família!'),
    s('She didn’t ____ anything.', 'say', 'Ela não disse nada.'),
    s('Please ____ me the truth.', 'tell', 'Por favor, me diga a verdade.'),
    s('What did he ____ to you?', 'say', 'O que ele disse para você?'),
    s('Our guide likes to ____ stories about the city.', 'tell', 'Nosso guia gosta de contar histórias sobre a cidade.'),
    s('How do you ____ "obrigado" in English?', 'say', 'Como se diz "obrigado" em inglês?'),
    s('Can you ____ her I’m late?', 'tell', 'Você pode avisar a ela que estou atrasado?'),
    s('I want to ____ thank you.', 'say', 'Quero dizer obrigado.'),
    s('Don’t ____ anyone about the surprise!', 'tell', 'Não conte para ninguém sobre a surpresa!'),
    s('He always ____s a joke at dinner.', 'tell', 'Ele sempre conta uma piada no jantar.'),
    s('They ____ the museum is beautiful.', 'say', 'Dizem que o museu é lindo.'),
  ],
}
