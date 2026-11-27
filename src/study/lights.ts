import type { Light } from './scheduler.ts'

/** Icon and label of each traffic-light state (colors always come with an icon). */
export const LIGHTS: Record<Light, { icon: string; label: string; hint: string }> = {
  discovering: { icon: '●', label: 'Descobrindo', hint: 'Palavra nova ou que você esqueceu. Revisões em minutos ou horas.' },
  learning: { icon: '◐', label: 'Aprendendo', hint: 'Você já lembra, mas o intervalo ainda é de 1 a 20 dias.' },
  learned: { icon: '✔', label: 'Aprendido', hint: 'O app confia que você lembra por 21 dias ou mais.' },
}
