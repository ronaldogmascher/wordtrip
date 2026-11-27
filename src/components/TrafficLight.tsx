import { LIGHTS } from '../study/lights.ts'
import type { Light } from '../study/scheduler.ts'

const ORDER: Light[] = ['discovering', 'learning', 'learned']

export default function TrafficLight() {
  return (
    <ul className="traffic">
      {ORDER.map((key) => (
        <li key={key} className={`state state-${key}`}>
          <span className="dot" aria-hidden="true">{LIGHTS[key].icon}</span>
          <div>
            <strong>{LIGHTS[key].label}</strong>
            <p className="muted">{LIGHTS[key].hint}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
