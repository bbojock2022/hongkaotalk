import { useEffect, useRef, useState } from 'react';
import { loadImageFile, imageToAscii } from '../utils/asciiArt';

export default function AsciiArtModal({ onInsert, onClose }) {
  const [imgData, setImgData] = useState(null); // { img, url }
  const [cols, setCols] = useState(70);
  const [ascii, setAscii] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imgData?.url) URL.revokeObjectURL(imgData.url);
    };
  }, [imgData]);

  useEffect(() => {
    if (!imgData) return;
    setAscii(imageToAscii(imgData.img, { cols }));
  }, [imgData, cols]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 가능해요.');
      return;
    }
    try {
      const data = await loadImageFile(file);
      setImgData(data);
    } catch {
      setError('이미지를 불러오지 못했어요.');
    }
  }

  function handleInsert() {
    onInsert('```\n' + ascii + '\n```');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-lg p-5 animate-pop max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-1">이미지 → 아스키 아트</h2>
        <p className="text-xs text-gray-500 mb-4">
          이미지를 그대로 보내지 않고, 문자로 비슷하게 흉내내서 텍스트 메시지로 보내요. (서버에 업로드되지 않고 브라우저에서만 변환돼요)
        </p>

        {!imgData ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-base-700 rounded-xl py-10 text-gray-500 hover:border-accent hover:text-gray-300 transition-colors"
          >
            📁 이미지 선택
          </button>
        ) : (
          <>
            <div className="mb-3">
              <label className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span>가로 문자 수</span>
                <span>{cols}자</span>
              </label>
              <input
                type="range"
                min="30"
                max="120"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-base-700 bg-black/40 p-2 mb-3">
              <pre className="text-[6px] leading-[7px] font-mono text-gray-200 whitespace-pre">{ascii}</pre>
            </div>

            <p className="text-[11px] text-gray-500 mb-3">약 {ascii.length.toLocaleString()}자로 변환돼요.</p>
          </>
        )}

        {error && <p className="text-xs text-danger mb-2">{error}</p>}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        <div className="flex gap-2 mt-auto">
          <button onClick={onClose} className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-base-800">
            취소
          </button>
          {imgData && (
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-base-800">
              다른 이미지
            </button>
          )}
          <button onClick={handleInsert} disabled={!ascii} className="btn-primary flex-1">
            메시지에 넣기
          </button>
        </div>
      </div>
    </div>
  );
}
