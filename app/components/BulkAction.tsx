// app/components/BulkAction.tsx
"use client";

import { useImageStore, getKey, sanitizeFilenameForDownload } from "../store/useImageStore";
import RenameAllButton from "./RenameAllButton";
import { zipFiles } from "../lib/zip";
import { RenameParams } from '../types/RenameParams';
import "../globals.css";

// --- Definición de Props ---

type Props = {
  
  vertical?: boolean;
  hasFiles?: boolean;
  // callback que recibe los params del modal
  onRenameAllParams?: (params: RenameParams) => void;
};
// --- Componente Principal ---
export default function BulkActions({vertical = false,hasFiles = false,
onRenameAllParams,
}: Props){

// Estado elevado desde el store
  const { converted, setConverted, clearAllFiles } = useImageStore();
  // Maneja la descarga de todas las imágenes convertidas en un archivo ZIP
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
// Maneja la limpieza de todas las conversiones
  const handleClearAll = () => {
    // Si no hay elementos convertidos, sale.
    if (!converted.length) return;

    // revoca las URLs para liberar memoria.
    converted.forEach((c) => {
      try {
        URL.revokeObjectURL(c.url);
      } catch (err) {
        // registra el error
        console.error("Error al revocar URL:", err);
      }
    });

    // Vacia el estado de las conversiones.
    setConverted([]);
};

// Maneja la eliminación de todos los archivos y conversiones
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
// Clases condicionales para el contenedor y botones
  const containerClass = `flex ${vertical ? "flex-col items-stretch" : "flex-row items-center"} gap-4`;
  const buttonBase =
    "px-3 py-1 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnSuccess = `${buttonBase} bg-gradient-to-r from-green-400/30 to-emerald-500/30 disabled:cursor-not-allowed`;
  const btnWarning = `${buttonBase} bg-gradient-to-r from-yellow-400/30 to-orange-500/30 disabled:cursor-not-allowed`;
  const btnDanger = `${buttonBase} bg-gradient-to-r from-red-500/30 to-rose-600/30`;
  
  
// --- Renderizado ---
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
         
        <RenameAllButton disabled={converted.length === 0 && !hasFiles}/>
     
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
        className={`${btnDanger} `}
        title="Eliminar todos los archivos y conversiones"
      >
        Limpiar todo
      </button>
    </div>
  );
}
