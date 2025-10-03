// app/components/BulkAction.tsx
"use client";

import React from "react";
import { ConvertedImage } from "../lib/convert";
import { zipFiles } from "../lib/zip";
import "../globals.css";
import { RenameParams } from '../types/RenameParams';
import RenameAllButton from "./RenameAllButton";



type Props = {
  converted: ConvertedImage[];
  setConverted: React.Dispatch<React.SetStateAction<ConvertedImage[]>>;
  clearAllFiles: () => void;
  vertical?: boolean;
  hasFiles?: boolean;
  // NUEVO: callback que recibe los params del modal
  onRenameAllParams?: (params: RenameParams) => void;
};

export default function BulkActions({
  converted,
  setConverted,
  clearAllFiles,
  vertical = false,
  hasFiles = false,
  onRenameAllParams,
}: Props) {
  const handleDownloadAll = async () => {
    if (!converted.length) return;
    try {
      const blob = await zipFiles(converted);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted-images.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      converted.forEach((c) => {
        try {
          URL.revokeObjectURL(c.url);
        } catch {}
      });
    } catch (err) {
      console.error("Error al generar ZIP:", err);
    }
  };

  const handleClearAll = () => {
    // Si no hay elementos convertidos, sale.
    if (!converted.length) return;

    // revocar las URLs para liberar memoria.
    converted.forEach((c) => {
      try {
        URL.revokeObjectURL(c.url);
      } catch (err) {
        // registrar el error
        console.error("Error al revocar URL:", err);
      }
    });

    // Vaciamos el estado de las conversiones.
    setConverted([]);
};

  const handleRemoveAll = () => {
    console.log('handleRemoveAll called', { hasFiles, convertedLength: converted.length });
    if (!hasFiles && converted.length === 0) {
      console.log('Botón deshabilitado: no hay archivos ni conversiones');
      return;
    }
    const ok = typeof window !== "undefined" ? window.confirm("¿Eliminar todos los archivos y conversiones?.") : true;
    if (!ok) {
      console.log('El usuario canceló la confirmación');
      return;
    }
    console.log('Limpiando archivos y conversiones...');
    clearAllFiles(); // Esto limpia archivos y conversiones
    setConverted([]); // Por redundancia, pero clearAllFiles debería limpiar ambos
  };

  const containerClass = `flex ${vertical ? "flex-col items-stretch" : "flex-row items-center"} gap-4`;
  const buttonBase =
    "px-3 py-1 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnSuccess = `${buttonBase} bg-gradient-to-r from-green-400/30 to-emerald-500/30 disabled:cursor-not-allowed`;
  const btnWarning = `${buttonBase} bg-gradient-to-r from-yellow-400/30 to-orange-500/30 disabled:cursor-not-allowed`;
  const btnDanger = `${buttonBase} bg-gradient-to-r from-red-500/30 to-rose-600/30`;
  
  

  return (
    <div className={containerClass} data-testid="bulk-actions-root" role="group" aria-label="Bulk actions">
      <button
        data-testid="download-all-btn"
        onClick={handleDownloadAll}
        disabled={converted.length === 0}
        className={`${btnSuccess} `}
        aria-disabled={converted.length === 0}
      >
        Descargar todo (zip)
      </button>
         
        <RenameAllButton
          disabled={converted.length === 0 && !hasFiles}
          onApply={(params) => {
            // Llamada segura: si el padre no pasó la función, no hace nada.
            onRenameAllParams?.(params);
          }}
        />
     
      <button
        data-testid="clear-all-btn"
        onClick={handleClearAll}
        disabled={converted.length === 0}
        className={`${btnWarning} `}
        aria-disabled={converted.length === 0}
      >
        Limpiar conversiones
      </button>

      <button
        data-testid="remove-all-btn"
        onClick={handleRemoveAll}
        /* disabled={!hasFiles && converted.length === 0} */
        className={`${btnDanger} `}
        /* aria-disabled={!hasFiles && converted.length === 0} */
        title="Eliminar todos los archivos y conversiones"
      >
        Limpiar todo
      </button>
    </div>
  );
}
