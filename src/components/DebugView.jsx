export default function DebugView({ words }) {
  const perLevel = {};
  for (const w of words) {
    perLevel[w.jlptLevel] = (perLevel[w.jlptLevel] || 0) + 1;
  }

  const first10 = words.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Goi-chou Debug View</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <p className="text-2xl font-bold text-blue-600 mb-4">
            {words.length.toLocaleString()} words loaded
          </p>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map(level => (
              <div key={level} className="flex justify-between max-w-xs">
                <span className="font-medium">N{level}</span>
                <span className="text-gray-600">
                  {perLevel[level]?.toLocaleString() || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">First 10 Words</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4">Kanji</th>
                  <th className="py-2 pr-4">Reading</th>
                  <th className="py-2 pr-4">Meaning</th>
                  <th className="py-2">Level</th>
                </tr>
              </thead>
              <tbody>
                {first10.map(w => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{w.kanji}</td>
                    <td className="py-2 pr-4">{w.reading}</td>
                    <td className="py-2 pr-4">{w.meaning}</td>
                    <td className="py-2">N{w.jlptLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
