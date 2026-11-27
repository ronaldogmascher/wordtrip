export default function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="screen">
      <h1>{title}</h1>
      <div className="card">
        <p className="muted">{text}</p>
        <p className="badge">Em construção</p>
      </div>
    </section>
  )
}
