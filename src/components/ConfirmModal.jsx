export default function ConfirmModal({ title, message, confirmLabel = '확인', onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onCancel}>
      <div className="card w-full max-w-xs p-5 animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-1">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-base-800">
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white ${
              danger ? 'bg-danger hover:bg-red-600' : 'bg-accent hover:bg-accent-light'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
