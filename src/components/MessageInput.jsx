import { useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { validateMessage, LIMITS } from '../utils/validate';

export default function MessageInput({ members, replyingTo, onCancelReply, onSend, rateLimiter }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const textareaRef = useRef(null);

  function autoResize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }

  function handleTextChange(e) {
    const val = e.target.value;
    setText(val);
    autoResize(e.target);
    const match = val.match(/@([^\s@]*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function insertMention(nickname) {
    setText((t) => t.replace(/@([^\s@]*)$/, `@${nickname} `));
    setMentionQuery(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // 메시지 본문은 여기서 태그를 제거하지 않습니다. 렌더링은 항상 React의 텍스트 노드로
    // 이루어져 자동으로 이스케이프되므로(= dangerouslySetInnerHTML을 쓰지 않으므로) 실행될 위험이
    // 전혀 없고, 오히려 예전처럼 태그처럼 보이는 부분을 통째로 지워버리면 코드 스니펫이 깨집니다.
    const clean = text.trim();
    const err = validateMessage(clean);
    if (err) return setError(err);

    if (rateLimiter && !rateLimiter.canSend()) {
      setError('메시지를 너무 빠르게 보내고 있어요. 잠시 후 다시 시도해주세요.');
      return;
    }

    const mentions = [...clean.matchAll(/@([^\s@]{1,20})/g)].map((m) => m[1]);

    onSend({
      text: clean,
      mentions,
      replyTo: replyingTo
        ? { senderNickname: replyingTo.senderNickname, text: replyingTo.text || null }
        : null,
    });
    setText('');
    onCancelReply?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  const filteredMembers =
    mentionQuery !== null
      ? members.filter((m) => m.nickname?.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 5)
      : [];

  return (
    <div className="border-t border-base-800 p-3 relative">
      {replyingTo && (
        <div className="flex items-center justify-between bg-base-800 rounded-lg px-3 py-1.5 mb-2 text-xs text-gray-400 animate-fade-in">
          <span className="truncate">↩ {replyingTo.senderNickname}에게 답장 중</span>
          <button onClick={onCancelReply} className="text-gray-500 hover:text-gray-200 px-1">✕</button>
        </div>
      )}

      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 card p-1 w-48 animate-fade-in z-10">
          {filteredMembers.map((m) => (
            <button
              key={m.uid}
              onClick={() => insertMention(m.nickname)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-base-800 text-sm"
            >
              @{m.nickname}
            </button>
          ))}
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-full right-3 mb-2 z-10 animate-pop">
          <EmojiPicker
            theme="dark"
            onEmojiClick={(emojiData) => {
              setText((t) => t + emojiData.emoji);
              setShowEmoji(false);
            }}
          />
        </div>
      )}

      {error && <p className="text-xs text-danger mb-1.5">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          placeholder="메시지 보내기... (@닉네임 멘션, ```코드``` 로 코드 블록, Shift+Enter 줄바꿈)"
          className="input-field resize-none max-h-60 leading-relaxed"
        />

        <button
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          title="이모지"
          className="w-9 h-9 shrink-0 rounded-lg bg-base-800 hover:bg-base-700 flex items-center justify-center text-lg"
        >
          😊
        </button>

        <button type="submit" className="btn-primary shrink-0">전송</button>
      </form>

      {text.length > LIMITS.MESSAGE_MAX * 0.8 && (
        <p className={`text-[11px] mt-1 text-right ${text.length > LIMITS.MESSAGE_MAX ? 'text-danger' : 'text-gray-500'}`}>
          {text.length.toLocaleString()} / {LIMITS.MESSAGE_MAX.toLocaleString()}
        </p>
      )}
    </div>
  );
}
