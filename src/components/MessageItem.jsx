import { useState } from 'react';
import { sanitizeText } from '../utils/sanitize';
import Avatar from './Avatar';

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

// ```lang\ncode\n``` 형태의 펜스 코드 블록을 분리합니다. 나머지는 일반 텍스트로 취급합니다.
function splitCodeBlocks(text) {
  const parts = [];
  const fence = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let m;
  while ((m = fence.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push({ type: 'text', content: text.slice(lastIndex, m.index) });
    parts.push({ type: 'code', lang: m[1] || '', content: m[2].replace(/\n$/, '') });
    lastIndex = fence.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', content: text.slice(lastIndex) });
  return parts;
}

// 일반 텍스트 안의 `인라인 코드` 와 @멘션을 처리합니다.
// 여기서 렌더링되는 모든 문자열은 React 텍스트 노드로만 출력되어(dangerouslySetInnerHTML 미사용)
// 항상 안전하게 이스케이프됩니다 — 어떤 내용을 보내도 실행되지 않습니다.
function renderInline(text, myNickname) {
  const segs = text.split(/(`[^`\n]+`)/g);
  return segs.map((seg, i) => {
    if (seg.length > 1 && seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-base-800 text-accent-light text-[13px] font-mono">
          {seg.slice(1, -1)}
        </code>
      );
    }
    const mentionParts = seg.split(/(@[^\s@]{1,20})/g);
    return mentionParts.map((part, j) => {
      if (part.startsWith('@') && part.length > 1) {
        const isMe = part.slice(1) === myNickname;
        return (
          <span key={`${i}-${j}`} className={isMe ? 'bg-accent/30 text-accent-light rounded px-1' : 'text-accent-light'}>
            {part}
          </span>
        );
      }
      return <span key={`${i}-${j}`}>{part}</span>;
    });
  });
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg overflow-hidden border border-base-700 bg-black/30 my-1">
      <div className="flex items-center justify-between px-3 py-1 bg-base-800/70 text-[11px] text-gray-500">
        <span className="uppercase tracking-wide">{lang || 'code'}</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {
              // 클립보드 권한이 없으면 조용히 무시
            }
          }}
          className="hover:text-gray-200 transition-colors"
        >
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed">
        <code className="font-mono text-gray-200 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export default function MessageItem({ message, isOwn, myNickname, onDelete, onReply }) {
  if (message.system) {
    return (
      <div className="text-center text-xs text-gray-500 py-1 animate-fade-in">
        {sanitizeText(message.text)}
      </div>
    );
  }

  if (message.deleted) {
    return (
      <div className="flex gap-3 px-4 py-1 group">
        <div className="w-9 shrink-0" />
        <p className="text-sm text-gray-600 italic">삭제된 메시지입니다.</p>
      </div>
    );
  }

  const segments = message.text ? splitCodeBlocks(message.text) : [];

  return (
    <div className="flex gap-3 px-4 py-1.5 hover:bg-white/[0.02] group animate-fade-in">
      <Avatar
        nickname={message.senderNickname}
        avatarColor={message.senderAvatarColor}
        avatarEmoji={message.senderAvatarEmoji}
        className="w-9 h-9 text-sm mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-200">{sanitizeText(message.senderNickname)}</span>
          <span className="text-[11px] text-gray-500">{formatTime(message.createdAt)}</span>
        </div>

        {message.replyTo && (
          <div className="text-xs text-gray-500 border-l-2 border-base-600 pl-2 mt-0.5 mb-1 truncate max-w-md">
            ↪ {sanitizeText(message.replyTo.senderNickname)}: {(message.replyTo.text || '').slice(0, 80)}
          </div>
        )}

        {segments.length > 0 && (
          <div className="text-sm text-gray-300 space-y-1">
            {segments.map((seg, i) =>
              seg.type === 'code' ? (
                <CodeBlock key={i} code={seg.content} lang={seg.lang} />
              ) : (
                seg.content && (
                  <p key={i} className="whitespace-pre-wrap break-words leading-relaxed">
                    {renderInline(seg.content, myNickname)}
                  </p>
                )
              )
            )}
          </div>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1 shrink-0">
        <button onClick={() => onReply(message)} title="답장" className="text-gray-500 hover:text-gray-200 text-xs px-1.5 py-1 rounded hover:bg-base-800">
          ↩
        </button>
        {isOwn && (
          <button onClick={() => onDelete(message.id)} title="삭제" className="text-gray-500 hover:text-danger text-xs px-1.5 py-1 rounded hover:bg-base-800">
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
