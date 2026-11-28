/** A postcard earned by beating a city's boss; they are stuck on the motorhome on the map. */
export default function Postcard({ icon, name, landmark, date }: { icon: string; name: string; landmark: string; date?: Date }) {
  return (
    <div className="postcard">
      <span className="postcard-icon" aria-hidden="true">{icon}</span>
      <div>
        <strong>Cartão-postal de {name}</strong>
        <p className="muted">{landmark}{date && ` · ${date.toLocaleDateString('pt-BR')}`}</p>
      </div>
    </div>
  )
}
