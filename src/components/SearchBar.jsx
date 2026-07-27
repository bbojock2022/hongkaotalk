import { useState } from 'react';
import { searchMessages } from '../firebase/firestore';
import { sanitizeText } from '../utils/sanitize';

function highlightMatch(text, keyword) {
  if (!keyword) return text;
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/40 text-white rounded-sm">{text.slice(idx, idx + keyword.length)}</mark>
      {text.slice(idx + keyword.length)}
    </>
  );
}

export default function SearchBar({ roomId, onClose, onJumpTo }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await searchMessages(roomId, keyword.trim());
    setResults(res);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-20 z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md p-4 animate-pop max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <input
            className="input-field"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="메시지 검색... (최근 500개 메시지 범위)"
            autoFocus
          />
          <button type="submit" className="btn-primary shrink-0">검색</button>
        </form>

        {searched && !loading && (
          <p className="text-xs text-gray-500 mb-1.5">{results.length}개 결과</p>
        )}

        <div className="overflow-y-auto flex-1 space-y-1">
          {loading && <p className="text-sm text-gray-500">검색 중...</p>}
          {!loading && searched && results.length === 0 && <p className="text-sm text-gray-500">결과가 없습니다.</p>}
          {results.map((m) => {
            const preview = (m.text || '').replace(/```[\s\S]*?```/g, '[코드]').replace(/\s+/g, ' ').trim();
            return (
              <button
                key={m.id}
                onClick={() => onJumpTo(m)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-800 text-sm"
              >
                <span className="text-accent-light font-medium">{sanitizeText(m.senderNickname)}</span>
                <span className="text-gray-400">: {highlightMatch(preview, keyword.trim())}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
