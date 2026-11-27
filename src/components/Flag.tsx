// Small flags drawn in SVG: flag emojis don't render on Windows (they show letters like "BR").
type Country = 'BR' | 'US' | 'UK'

const LABEL: Record<Country, string> = { BR: 'Português', US: 'Inglês americano', UK: 'Inglês britânico' }

export default function Flag({ country }: { country: Country }) {
  return (
    <svg className="flag" viewBox="0 0 28 20" width="21" height="15" role="img" aria-label={LABEL[country]}>
      {country === 'BR' && (
        <>
          <rect width="28" height="20" fill="#009c3b" />
          <path d="M14 2.5 25.5 10 14 17.5 2.5 10z" fill="#ffdf00" />
          <circle cx="14" cy="10" r="4.6" fill="#002776" />
          <path d="M9.6 9.2c3-.9 6.1-.5 8.8 1" stroke="#fff" strokeWidth="0.9" fill="none" />
        </>
      )}
      {country === 'US' && (
        <>
          <rect width="28" height="20" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={i * (20 / 13)} width="28" height={20 / 13} fill="#b22234" />
          ))}
          <rect width="12" height={(20 / 13) * 7} fill="#3c3b6e" />
        </>
      )}
      {country === 'UK' && (
        <>
          <rect width="28" height="20" fill="#012169" />
          <path d="M0 0 28 20M28 0 0 20" stroke="#fff" strokeWidth="4" />
          <path d="M0 0 28 20M28 0 0 20" stroke="#c8102e" strokeWidth="1.5" />
          <path d="M14 0v20M0 10h28" stroke="#fff" strokeWidth="6" />
          <path d="M14 0v20M0 10h28" stroke="#c8102e" strokeWidth="3.5" />
        </>
      )}
      <rect width="28" height="20" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" rx="1" />
    </svg>
  )
}
