import React from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message = "",
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  // Portal – Modal landet ganz oben im DOM (neben <body>)
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ── Dialog ── */}
      <div className="glass-card relative w-[90vw] max-w-md p-6 animate-pop">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="mb-6 text-white/80">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-accent"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className="btn-primary"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
