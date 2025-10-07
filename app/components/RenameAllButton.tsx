// app/components/RenameAllButton.tsx
"use client";

import { useState } from "react";
import RenameModal from "./RenameModal";
import { useImageStore } from '../store/useImageStore';

type Props = {
  disabled?: boolean;
  compact?: boolean; // si true, usar estilo compacto (opcional)
};

export default function RenameAllButton({ disabled = false, compact = false }: Props) {
  const [open, setOpen] = useState(false);

  const renameAll = useImageStore(s => s.renameAll);

  const buttonBase = "px-3 py-1 rounded-full backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnInfo = `${buttonBase} bg-gradient-to-r from-blue-400/30 to-indigo-500/30`;

  // Clases visuales cuando está deshabilitado (opcional, puedes cambiarlas)
  const disabledClass = "opacity-50 cursor-not-allowed pointer-events-none";

  // guardia extra para evitar abrir el modal por cualquier vía si está deshabilitado
  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
  };

  return (
    <>
      <button
        data-testid="rename-all-trigger"
        onClick={handleOpen}
        disabled={disabled}
        aria-disabled={disabled}
        className={btnInfo + (compact ? " px-2 py-0.5 text-xs" : "") + (disabled ? ` ${disabledClass}` : "")}
        title="Renombrar todas las imágenes"
      >
        Renombrar todo
      </button>

      <RenameModal
        open={open}
        initial={{ prefix: "", name: "", keyType: "index" }}
        onApply={(params) => {
          if (typeof renameAll === "function") {
            renameAll(params); // aplica renombrado en el store
          } else {
            console.error("renameAll no está disponible en useImageStore()");
          }
          setOpen(false);// cerrar modal
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
