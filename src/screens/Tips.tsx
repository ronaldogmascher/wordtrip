import { Link } from 'react-router-dom'

// "Como estudar melhor": best practices, shown once right after the first-launch setup and
// always available from Ajustes and the manual.

const TIPS = [
  {
    icon: '⏰',
    title: 'Tenha um horário fixo',
    text: 'Escolha um momento do dia para estudar (depois do café, no ônibus, antes de dormir) e transforme em hábito. Fica muito mais fácil quando não depende de lembrar.',
  },
  {
    icon: '🐢',
    title: 'Constância vale mais que velocidade',
    text: '15 minutos todo dia rendem muito mais que 2 horas uma vez por semana. A memória se fortalece com as revisões espaçadas, e o app só consegue agendá-las se você aparecer.',
  },
  {
    icon: '🌱',
    title: 'Comece com poucas palavras novas',
    text: 'O cérebro trava quando recebe muita novidade de uma vez, e as revisões se acumulam nos dias seguintes. Comece com poucas novas por dia (o padrão é 15; se pesar, baixe para 5 ou 10 nos Ajustes), faça bastante repetição e só aumente quando as revisões estiverem tranquilas. Exagerar no começo é o caminho mais rápido para a frustração e para desistir.',
  },
  {
    icon: '🗣️',
    title: 'Fale em voz alta',
    text: 'Leia as palavras e frases em voz alta e imite o ritmo e a entonação do áudio. Isso fixa melhor, treina a fala e acostuma os músculos do rosto a sons que não existem no português. A voz é de computador, mas ajuda bastante.',
  },
  {
    icon: '👂',
    title: 'Aprenda a ouvir os sons do inglês',
    text: 'O inglês tem sons que não existem no português, e quem não os ouve também não consegue falá-los. Faça a Trilha de IPA no camping, na Autoescola: são poucos minutos por dia, e depois disso você vai entender o IPA de cada card (as letras entre barras, como /ʃɪp/) e perceber a diferença entre "ship" e "sheep".',
  },
  {
    icon: '🤝',
    title: 'Seja honesto na nota',
    text: 'Se não entendeu a palavra, não dê nota alta. A nota não é uma prova: ela serve para o app decidir quando mostrar a palavra de novo. Use o botão Traduzir quantas vezes precisar, sem culpa. Quando menos esperar, seu vocabulário terá crescido muito.',
  },
  {
    icon: '✍️',
    title: 'Tenha um caderno de papel',
    text: 'Anote à mão as palavras, frases e expressões que mais custam a entrar, com significado e exemplos. Escrever à mão envolve outros sentidos e fixa melhor que digitar.',
  },
  {
    icon: '🎧',
    title: 'Mergulhe no idioma fora do app',
    text: 'Só o app não basta. Ouça podcasts, assista vídeos e séries com legenda em inglês, leia textos curtos e use as palavras novas: invente frases, repita durante o dia e anote no Diário de bordo as palavras que encontrar por aí.',
  },
  {
    icon: '🎁',
    title: 'Defina uma recompensa em cada cidade',
    text: 'Ao chegar numa cidade nova, escolha no mapa um prêmio de verdade para quando vencer o chefão: um açaí, um filme, um passeio. Ter algo concreto à frente dá um empurrão extra nos dias de preguiça, e cada conquista fica guardada no Mural.',
  },
  {
    icon: '🛡️',
    title: 'Renove o seguro do motorhome',
    text: 'Salve um backup de vez em quando em Ajustes. Seu progresso fica só no aparelho, e o seguro garante que nada se perde se o celular quebrar ou for trocado.',
  },
]

export default function Tips() {
  return (
    <section className="screen">
      <p className="eyebrow">Antes de pegar a estrada</p>
      <h1>🧭 Como estudar melhor</h1>
      <p className="muted">Algumas dicas para aproveitar o WordTrip ao máximo e chegar a Nova York.</p>
      <div className="card">
        <ul className="intro-list tips">
          {TIPS.map((t) => (
            <li key={t.title}>
              <span aria-hidden="true">{t.icon}</span>
              <span><strong>{t.title}.</strong> {t.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <Link className="button primary" to="/">Pegar a estrada! 🚐</Link>
    </section>
  )
}
