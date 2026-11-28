import { Link } from 'react-router-dom'
import HowItWorks from '../components/HowItWorks.tsx'
import TrafficLight from '../components/TrafficLight.tsx'
import { LEGS } from '../content/legs.ts'
import { BOSS_PASS_SHARE, BORDER_BOSS_QUESTIONS, BOSS_RETRY_HOURS, BOSS_TRIES_IN_A_ROW, CITY_BOSS_QUESTIONS } from '../game/boss.ts'
import { PENALTY, WRONG_ANSWER_CAP } from '../study/scoring.ts'
import { RECOVERY_OFF, RECOVERY_ON, REVIEWS_PER_NEW } from '../study/session.ts'

// A short instruction manual: how the app works, one topic per section.

export default function Manual() {
  const pass = Math.round(BOSS_PASS_SHARE * 100)
  return (
    <section className="screen">
      <h1>📘 Como funciona o WordTrip</h1>
      <div className="card">
        <h2>Em resumo</h2>
        <HowItWorks />
      </div>

      <div className="card">
        <h2>🗺️ A rota: do A1 ao B2</h2>
        <p>A viagem tem quatro trechos, um para cada nível do Quadro Europeu (CEFR). Cada trecho termina numa fronteira com um chefão especial.</p>
        <ol className="legs">
          {LEGS.map((leg) => (
            <li key={leg.cefr}>
              <strong>{leg.cefr} · {leg.name}</strong> <span className="muted">· cerca de {leg.words.toLocaleString('pt-BR')} palavras no total</span>
              <p className="muted">{leg.places}</p>
            </li>
          ))}
        </ol>
        <p className="muted">Por enquanto o app traz o trecho A1 completo; os próximos chegam nas próximas versões.</p>
      </div>

      <div className="card manual">
        <details>
          <summary>🚦 O semáforo</summary>
          <TrafficLight />
        </details>
        <details>
          <summary>📅 A sessão do dia</summary>
          <p>Todo dia o app separa as <strong>revisões</strong> (palavras que estão na hora de relembrar) e as <strong>novas</strong> (as próximas palavras da cidade atual, até o limite diário dos Ajustes). A "Sessão do dia" mistura as duas: uma nova a cada {REVIEWS_PER_NEW} revisões. Também dá para fazer "Só revisão" ou "Só novas".</p>
          <p>Se acumularem mais de {RECOVERY_ON} revisões atrasadas, entra o <strong>modo recuperação</strong>: as novas pausam até ficarem menos de {RECOVERY_OFF}, para você não se afogar.</p>
        </details>
        <details>
          <summary>🔢 A nota de cada card</summary>
          <p>Traduzir e pedir dica fazem parte do aprendizado: use sempre que precisar. A nota só serve para o app decidir quando mostrar cada palavra de novo.</p>
          <ul>
            <li>Você dá uma nota de 0 a 10 para o quão fácil foi (0 = não lembrei, 10 = muito fácil).</li>
            <li>O app ajusta essa nota pelo que aconteceu no card: erro pequeno de ortografia −{PENALTY.typo}, tradução −{PENALTY.translation}, dica −{PENALTY.hint}.</li>
            <li>Se a resposta estiver errada, a nota final fica em no máximo {WRONG_ANSWER_CAP}.</li>
            <li>A nota final cai numa faixa: 0–3 Errei, 4–6 Difícil, 7–8 Bom, 9–10 Fácil. Quanto melhor a faixa, mais tempo até a próxima revisão (algoritmo FSRS).</li>
            <li>Depois de 2 acertos seguidos com nota 7 ou mais, a palavra passa da múltipla escolha para a escrita. Se errar a escrita 2 vezes seguidas, ela volta para a múltipla escolha.</li>
            <li>"Já sei": se você digitar a palavra certa sem tradução e sem dica, ela pula direto para uma revisão bem mais distante.</li>
          </ul>
        </details>
        <details>
          <summary>⚔️ Chefões e cidades</summary>
          <ul>
            <li>O chefão de uma cidade aparece quando {pass}% das palavras dela estiverem amarelas ou verdes.</li>
            <li>São {CITY_BOSS_QUESTIONS} perguntas escritas, sem tradução e sem dica. Acertando {pass}%, você vence.</li>
            <li>Vencendo: ganha o cartão-postal da cidade, a recompensa pessoal que você definiu (se definiu) e a próxima cidade abre.</li>
            <li>Perdendo: as palavras que você errou voltam para a revisão e você pode tentar de novo na hora, com perguntas novas. Depois de {BOSS_TRIES_IN_A_ROW} derrotas seguidas, a revanche abre em {BOSS_RETRY_HOURS} horas.</li>
            <li>Depois de cada resposta do chefão aparecem a tradução da palavra, da definição e da frase.</li>
            <li>Na última cidade de cada trecho fica o chefão da fronteira, com {BORDER_BOSS_QUESTIONS} perguntas de todo o trecho. Vencendo, o motorhome ganha um upgrade.</li>
          </ul>
        </details>
        <details>
          <summary>🎁 Recompensas</summary>
          <p>Ao chegar numa cidade, defina no mapa uma recompensa de verdade para quando vencer o chefão de lá: um açaí, um filme, um passeio, o que te motivar. Vale a pena fazer isso em toda cidade: ter um prêmio concreto à frente ajuda muito nos dias de preguiça. Quando você vence o chefão, a recompensa é liberada e vai para o Mural de conquistas, no fim do mapa.</p>
        </details>
        <details>
          <summary>🛣️ Km, combustível e nível</summary>
          <p>Cada card respondido faz o motorhome rodar: quanto melhor a nota, mais km. Os km nunca diminuem. Cada km vira 1 ⛽ de combustível, que em breve servirá para passeios bônus, personalizar o motorhome e proteger a sequência. O nível do viajante sobe com os km (100 km para o nível 2, mais 200 para o 3, e assim por diante).</p>
        </details>
        <details>
          <summary>📓 Diário de bordo</summary>
          <p>Achou uma palavra em inglês por aí? Anote no Diário. Se ela já existe na rota, é estudada antes ("encontrada na estrada"). Se não existe, você cria o card. Também dá para importar um texto (um "Desvio") e estudar as palavras dele.</p>
        </details>
        <details>
          <summary>🛡️ Seguro do motorhome (backup)</summary>
          <p>Tudo fica guardado só neste aparelho. Em Ajustes → Seguro do motorhome você salva um arquivo com toda a sua viagem e pode carregá-lo depois, no mesmo celular ou em outro. O app lembra de renovar o seguro (semanal por padrão; dá para mudar ou desligar).</p>
        </details>
        <details>
          <summary>🚗 Autoescola</summary>
          <p>Quem começa do zero ou com o básico da escola tira a carteira de motorista antes de viajar. As <strong>aulas iniciais</strong> ensinam o alfabeto, cumprimentos, números, pronomes e verbo to be, cores, família, casa, comida, dias e meses, e perguntas básicas. Cada aula tem uma parte para conhecer as palavras (ouça e repita em voz alta) e um exercício de múltipla escolha. Depois de cada resposta aparecem a pronúncia (IPA) e os botões para ouvir de novo. A <strong>prova da CNH</strong> tem 30 perguntas de todas as aulas; acertando 80%, o mapa abre. Até lá, dá para ver o caminho no mapa, com cadeados em todas as cidades; com a CNH, ela aparece no topo do mapa como conquista. Se não passar, a segunda tentativa é na hora; depois de 2, espere 24 horas.</p>
          <p>A Autoescola fica sempre aberta para reciclagem, junto com a <strong>prática livre</strong>: números, horas e cores, a trilha de pronúncia (IPA), tempos verbais e regrinhas de gramática, e a Oficina, que reforça as palavras que você mais erra com âncoras, ditado e frases suas. Nada disso mexe nas revisões.</p>
        </details>
        <details>
          <summary>🌱 Seu nível e o modo iniciante</summary>
          <ul>
            <li><strong>Do zero ou pré-iniciante:</strong> começa na Autoescola; o mapa abre com a CNH.</li>
            <li><strong>Iniciante:</strong> vai direto para o mapa.</li>
            <li><strong>Intermediário ou avançado:</strong> pode fazer a prova de nivelamento (50 perguntas do trecho A1, 2 tentativas). Passando, as cidades do Brasil ficam concluídas e as palavras delas entram como revisões leves.</li>
          </ul>
          <p>No <strong>modo iniciante</strong> (ligado para os três primeiros níveis), a tradução da definição já vem aberta em todo card e não desconta na nota. Desligue em Ajustes quando entender a maioria das definições em inglês: aí o botão Traduzir volta a descontar.</p>
        </details>
      </div>
      <div className="row">
        <Link className="button" to="/dicas">🧭 Como estudar melhor</Link>
        <Link className="button" to="/">Voltar ao início</Link>
      </div>
    </section>
  )
}
