export default function Avatar({ nickname = '?', avatarColor, avatarEmoji, className = 'w-8 h-8 text-xs' }) {
  const style = avatarColor ? { backgroundColor: avatarColor } : undefined;
  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-semibold shrink-0 ${
        avatarColor ? '' : 'bg-base-700'
      }`}
      style={style}
    >
      {avatarEmoji || (nickname || '?')[0].toUpperCase()}
    </div>
  );
}
