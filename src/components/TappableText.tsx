/** Renders text where every English word can be tapped (to open it in the dictionary). */
export default function TappableText({ text, onWord }: { text: string; onWord: (word: string) => void }) {
  const parts = text.split(/([A-Za-z][A-Za-z'’-]*)/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="tappable"
            role="button"
            tabIndex={0}
            onClick={() => onWord(part)}
            onKeyDown={(e) => e.key === 'Enter' && onWord(part)}
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}
