// components/journal/GrammarTab.jsx
export function GrammarTab({ grammar = [] }) {
  if (grammar.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600 text-sm">
        No grammar concepts encountered yet.
        <br />Play Grammar cards to fill your journal.
      </div>
    )
  }
  return (
    <div className="divide-y divide-gray-800/50">
      {[...grammar].reverse().map((entry) => (
        <div key={entry.questionId} className="px-5 py-3">
          <div className="text-sm font-bold text-blue-300 mb-0.5">{entry.concept}</div>
          {entry.pattern && (
            <div className="text-xs text-gray-400 font-mono mb-1">{entry.pattern}</div>
          )}
          {entry.example && (
            <p className="text-xs text-gray-500 italic">{entry.example}</p>
          )}
        </div>
      ))}
    </div>
  )
}
