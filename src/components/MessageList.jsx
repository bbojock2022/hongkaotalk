import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

export default function MessageList({ messages, myUid, myNickname, onDelete, onReply }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const wasNearBottom = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (wasNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-3">
      {messages.length === 0 && (
        <p className="text-center text-sm text-gray-600 mt-10">아직 메시지가 없어요. 첫 메시지를 보내보세요 👋</p>
      )}
      {messages.map((m) => (
        <MessageItem
          key={m.id}
          message={m}
          isOwn={m.senderUid === myUid}
          myNickname={myNickname}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
