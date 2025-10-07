// app/components/RenameAllButton.tsx
"use client";

import { useState } from "react";
import RenameModal from "./RenameModal";
import { useImageStore } from '../store/useImageStore';




type Props = {
  disabled?: boolean;
  //onApplied?: (params: RenameParams) => void;
  compact?: boolean; // si true, usar estilo compacto (opcional)
};

export default function RenameAllButton({ disabled = false, compact = false }: Props) {
  const [open, setOpen] = useState(false);

  const renameAll = useImageStore(s => s.renameAll);

  const buttonBase = "px-3 py-1 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnInfo = `${buttonBase} bg-gradient-to-r from-blue-400/30 to-indigo-500/30`;

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
