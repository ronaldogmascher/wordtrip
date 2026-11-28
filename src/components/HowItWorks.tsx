// The quick introduction shown on first launch and at the top of the manual.

const INTRO = [
  { icon: '🚐', text: 'Você dirige um motorhome partindo da sua cidade, no Brasil, com destino final em Nova York, nos EUA. O objetivo é levar você do nível A1 (iniciante) ao B2 (intermediário avançado, umas 4.000 palavras). Cada cidade é uma fase com 50 palavras em inglês.' },
  { icon: '🃏', text: 'Cada card mostra uma definição em inglês e uma frase com lacuna. Primeiro você escolhe entre opções; depois que acerta algumas vezes, passa a digitar.' },
  { icon: '🚦', text: 'O semáforo mostra cada palavra: 🔴 descobrindo, 🟡 aprendendo, 🟢 aprendida (lembrada por 21 dias ou mais).' },
  { icon: '📅', text: 'O app decide quando cada palavra volta, bem antes de você esquecer. Basta fazer a sessão do dia, de preferência todo dia.' },
  { icon: '⚔️', text: 'Quando 80% das palavras de uma cidade estiverem amarelas ou verdes, aparece o chefão. Vencendo, você ganha um cartão-postal e segue para a próxima cidade.' },
  { icon: '🛣️', text: 'Cada resposta faz o motorhome rodar alguns km, que viram combustível ⛽ e sobem o seu nível.' },
]

export default function HowItWorks() {
  return (
    <ul className="intro-list">
      {INTRO.map((item) => (
        <li key={item.icon}><span aria-hidden="true">{item.icon}</span><span>{item.text}</span></li>
      ))}
    </ul>
  )
}
