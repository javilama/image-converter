// app/components/RenameAllButton.tsx
"use client";

import React, { useState } from "react";
import RenameModal, { RenameParams } from "./RenameModal";

type Props = {
  disabled?: boolean;
  // callback que el padre implementa para aplicar renombrado sobre la colección
  onApply: (params: RenameParams) => void;
  compact?: boolean; // si true, usar estilo compacto (opcional)
};

export default function RenameAllButton({ disabled = false, onApply, compact = false }: Props) {
  const [open, setOpen] = useState(false);

  const buttonBase = "px-3 py-1 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnInfo = `${buttonBase} bg-gradient-to-r from-blue-400/30 to-indigo-500/30 disabled:cursor-not-allowed`;

  return (
    <>
      <button
        data-testid="rename-all-trigger"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={btnInfo + (compact ? " px-2 py-0.5 text-xs" : "")}
        title="Renombrar todas las imágenes"
      >
        Renombrar todo
      </button>

      <RenameModal
        open={open}
        onClose={() => setOpen(false)}
        onApply={(params) => onApply(params)}
      />
    </>
  );
}
