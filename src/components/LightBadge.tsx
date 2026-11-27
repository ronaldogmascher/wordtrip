import { LIGHTS } from '../study/lights.ts'
import type { Light } from '../study/scheduler.ts'

/** Small pill with the traffic-light color of a word. */
export default function LightBadge({ light }: { light: Light }) {
  const { icon, label } = LIGHTS[light]
  return (
    <span className={`light-badge light-${light}`}>
      <span className="light-dot" aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}
