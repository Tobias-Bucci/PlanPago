import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  type = "default", // "danger", "warning", "info", "default"
}) {
  if (!open) return null;

  // Icon and color based on type
  const getTypeConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: <AlertTriangle size={24} className="text-red-400" />,
          confirmClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          borderClass: "border-red-500/30",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} className="text-amber-400" />,
          confirmClass: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
          borderClass: "border-amber-500/30",
        };
      case "info":
        return {
          icon: <AlertTriangle size={24} className="text-blue-400" />,
          confirmClass: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          borderClass: "border-blue-500/30",
        };
      default:
        return {
          icon: null,
          confirmClass: "btn-primary",
          borderClass: "border-white/20",
        };
    }
  };

  const typeConfig = getTypeConfig();

  // Portal – Modal lands at the top of the DOM (next to <body>)
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* ── Enhanced Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 20, 25, 0.9) 0%, rgba(26, 31, 46, 0.9) 25%, rgba(45, 55, 72, 0.9) 50%, rgba(26, 32, 44, 0.9) 75%, rgba(15, 20, 25, 0.9) 100%)",
        }}
        onClick={onClose}
      />

      {/* ── Enhanced Dialog ── */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 animate-pop`}
      >
        <div
          className={`glass-card p-8 border-2 ${typeConfig.borderClass} shadow-2xl`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Header with icon */}
          <div className="flex items-center gap-4 mb-6">
            {typeConfig.icon && (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                {typeConfig.icon}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                {title}
              </h3>
            </div>
          </div>

          {/* Message */}
          <div className="mb-8">
            <p className="text-white/80 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="btn-accent px-6 py-3 order-2 sm:order-1"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm?.();
                onClose?.();
              }}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 order-1 sm:order-2 ${typeConfig.confirmClass.includes("btn-primary")
                  ? "btn-primary"
                  : `${typeConfig.confirmClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent shadow-lg`
                }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
