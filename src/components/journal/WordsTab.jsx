// components/journal/WordsTab.jsx
export function WordsTab({ words = [] }) {
  if (words.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600 text-sm">
        No vocabulary encountered yet this run.
        <br />Play Vocabulary cards to fill your journal.
      </div>
    )
  }
  return (
    <div className="divide-y divide-gray-800/50">
      {[...words].reverse().map((entry) => (
        <div key={entry.questionId} className="px-5 py-3">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-base font-bold text-white">{entry.word}</span>
            {entry.reading && <span className="text-xs text-gray-500">{entry.reading}</span>}
            <span className="text-sm text-gray-300 ml-auto">{entry.translation}</span>
          </div>
          {entry.example && (
            <p className="text-xs text-gray-500 italic">{entry.example}</p>
          )}
        </div>
      ))}
    </div>
  )
}
