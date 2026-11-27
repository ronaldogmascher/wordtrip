const states = [
  { key: 'discovering', icon: '●', label: 'Descobrindo', hint: 'Palavra nova ou que você esqueceu. Revisões em minutos ou horas.' },
  { key: 'learning', icon: '◐', label: 'Aprendendo', hint: 'Você já lembra, mas o intervalo ainda é de 1 a 20 dias.' },
  { key: 'learned', icon: '✔', label: 'Aprendido', hint: 'O app confia que você lembra por 21 dias ou mais.' },
] as const

export default function TrafficLight() {
  return (
    <ul className="traffic">
      {states.map((s) => (
        <li key={s.key} className={`state state-${s.key}`}>
          <span className="dot" aria-hidden="true">{s.icon}</span>
          <div>
            <strong>{s.label}</strong>
            <p className="muted">{s.hint}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
