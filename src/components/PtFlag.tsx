// Small Brazilian flag drawn in SVG: flag emojis don't render on Windows (they show "BR").
export default function PtFlag() {
  return (
    <svg className="pt-flag" viewBox="0 0 28 20" width="21" height="15" role="img" aria-label="Português">
      <rect width="28" height="20" rx="2" fill="#009c3b" />
      <path d="M14 2.5 25.5 10 14 17.5 2.5 10z" fill="#ffdf00" />
      <circle cx="14" cy="10" r="4.6" fill="#002776" />
      <path d="M9.6 9.2c3-.9 6.1-.5 8.8 1" stroke="#fff" strokeWidth="0.9" fill="none" />
    </svg>
  )
}
