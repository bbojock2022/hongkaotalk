import { useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { validateMessage } from '../utils/validate';
import { sanitizeText } from '../utils/sanitize';
import { uploadChatImage } from '../firebase/storage';

export default function MessageInput({ user, roomId, members, replyingTo, onCancelReply, onSend, rateLimiter }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const fileInputRef = useRef(null);

  function handleTextChange(e) {
    const val = e.target.value;
    setText(val);
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

    const clean = sanitizeText(text);
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
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadChatImage(roomId, user.uid, file);
      onSend({ imageURL: url, mentions: [], replyTo: null });
    } catch (err) {
      setError(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
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
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="이미지 첨부"
          className="w-9 h-9 shrink-0 rounded-lg bg-base-800 hover:bg-base-700 flex items-center justify-center text-lg disabled:opacity-50"
        >
          {uploading ? '⏳' : '🖼'}
        </button>

        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          placeholder="메시지 보내기... (@닉네임으로 멘션)"
          className="input-field resize-none max-h-32"
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
    </div>
  );
}
