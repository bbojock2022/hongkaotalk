import { sanitizeText } from '../utils/sanitize';

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function highlightMentions(text, myNickname) {
  const parts = text.split(/(@[^\s@]{1,20})/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const isMe = part.slice(1) === myNickname;
      return (
        <span key={i} className={isMe ? 'bg-accent/30 text-accent-light rounded px-1' : 'text-accent-light'}>
          {part}
        </span>
      );
    }
    return part;
  });
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

  return (
    <div className="flex gap-3 px-4 py-1.5 hover:bg-white/[0.02] group animate-fade-in">
      <div className="w-9 h-9 rounded-full bg-base-700 flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
        {(message.senderNickname || '?')[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-200">{sanitizeText(message.senderNickname)}</span>
          <span className="text-[11px] text-gray-500">{formatTime(message.createdAt)}</span>
        </div>

        {message.replyTo && (
          <div className="text-xs text-gray-500 border-l-2 border-base-600 pl-2 mt-0.5 mb-1 truncate max-w-md">
            ↪ {sanitizeText(message.replyTo.senderNickname)}: {sanitizeText(message.replyTo.text || '')}
          </div>
        )}

        {message.text && (
          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
            {highlightMentions(sanitizeText(message.text), myNickname)}
          </p>
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
