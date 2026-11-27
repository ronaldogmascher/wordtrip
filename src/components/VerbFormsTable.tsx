import type { VerbForms } from '../content/types.ts'

export default function VerbFormsTable({ lemma, forms }: { lemma: string; forms: VerbForms }) {
  const rows = [
    ['Presente (he/she)', forms.thirdPerson],
    ['Passado', forms.past],
    ['Particípio', forms.pastParticiple],
    ['Futuro', `will ${lemma}`],
    ['Gerúndio', forms.ing],
  ]
  return (
    <div className="verb-forms">
      <p className="verb-forms-title">
        Conjugação {forms.irregular ? <span className="badge badge-irregular">verbo irregular</span> : <span className="badge">verbo regular</span>}
      </p>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
