"use client";

type AlertModalProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export default function AlertModal({ open, message, onClose }: AlertModalProps) {

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white/10 backdrop-blur-md rounded-lg p-6 w-full max-w-sm shadow-lg border border-white/20">
        <h3 className="text-lg font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-500/50 to-pink-500/50 ">Formato no admitido</h3>
        <p className="text-sm text-gray-200/60 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500/30 to-rose-600/30 hover:scale-105 transition-all border border-white/20 cursor-pointer text-xs text-white"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
