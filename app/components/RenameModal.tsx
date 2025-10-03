// app/components/RenameModal.tsx
"use client";

import { useState } from "react";
import { FaArrowsRotate, FaArrowDownLong, FaTrashCan } from "react-icons/fa6";

export type RenameParams = {
  prefix: string;
  name: string;
  keyType: "index" | "original" | "counter";
};

type Props = {
  open: boolean;
  initial?: Partial<RenameParams>;
  onClose: () => void;
  onApply: (params: RenameParams) => void;
};

export default function RenameModal({ open, initial = {}, onClose, onApply }: Props) {
  const [prefix, setPrefix] = useState(initial.prefix ?? "");
  const [name, setName] = useState(initial.name ?? "");
  const [keyType, setKeyType] = useState<RenameParams["keyType"]>(initial.keyType ?? "index");

  if (!open) return null;

  const buttonBase =
    "px-3 py-2 flex items-center justify-center backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-xs durattion-200 shadow-md border border-white/20";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-purple-500/30 to-pink-500/30 disabled:cursor-not-allowed w-[20%] rounded-s-lg`;
  const btnSuccess = `${buttonBase} bg-gradient-to-r from-green-400/30 to-emerald-500/30 disabled:cursor-not-allowed gap-2 rounded-e-lg`;
 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      {/* modal */}
      <div className="relative bg-white/6 backdrop-blur-md rounded-lg p-6 w-full max-w-md shadow-lg border border-white/10">
        <h3 className="text-lg font-semibold mb-3">Renombrar por lote</h3>

        <label className="text-xs block mb-1">Prefijo (opcional)</label>
        <input
          className="w-full px-2 py-1 rounded bg-black/30 border border-gray-600 mb-3 text-sm text-white"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          placeholder="p.ej. directorio"
        />

        <label className="text-xs block mb-1">Nombre base</label>
        <input
          className="w-full px-2 py-1 rounded bg-black/30 border border-gray-600 mb-3 text-sm text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p.ej. img"
        />

        <label className="text-xs block mb-1">Key que diferencia cada imagen</label>
        <select
          className="w-full px-2 py-1 rounded bg-black/30 border border-gray-600 mb-4 text-sm text-white"
          value={keyType}
          onChange={(e) => setKeyType(e.target.value as RenameParams["keyType"])}
        >
          <option value="index">Índice (1,2,3...)</option>
          <option value="original">Nombre original</option>
          <option value="counter">Contador único</option>
        </select>

        <div className="flex gap-0 justify-end">
          <button
            className={btnPrimary}
            onClick={onClose}
            type="button"
            title="Cerrar modal"
          >
            Cancelar
          </button>
          <button
            className={btnSuccess}
            onClick={() => {
              onApply({ prefix, name, keyType });
              onClose();
            }}
            type="button"
            data-testid="rename-modal-apply"
            title="Aplicar renombrado masivo"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
