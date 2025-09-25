// app/components/BulkAction.tsx
"use client";

import { ConvertedImage } from "../lib/convert";
import { zipFiles } from "../lib/zip";
import "../globals.css";

type Props = {
  converted: ConvertedImage[];
  // setter para actualizar el array de conversiones (ej: limpiar)
  setConverted: (arr: ConvertedImage[]) => void;
  // nuevo prop para limpiar también los archivos originales
  clearAllFiles: () => void;
  // Si true: apila los botones en columna (vertical). Si false/omitido: fila (horizontal).
  // Esto permite reutilizar el componente en diferentes layouts sin tocar markup.
  vertical?: boolean;
};

/**
 * BulkActions
 *
 * Botones para:
 * - Descargar todas las imágenes convertidas en un ZIP.
 * - Limpiar solo las conversiones (liberar object URLs).
 * - Eliminar todo: archivos cargados y conversiones (reinicio completo).
 *
 * Nota: el layout (horizontal/vertical) se controla con la prop `vertical`.
 */





export default function BulkActions({
  converted,
  setConverted,
  clearAllFiles,
  vertical = false,
}: Props) {
  // Descargar todas las imágenes empaquetadas en un ZIP
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

      // Liberar object URLs de cada conversión ya que descargamos todo
      converted.forEach((c) => {
        try {
          URL.revokeObjectURL(c.url);
        } catch {}
      });
    } catch (err) {
      console.error("Error al generar ZIP:", err);
    }
  };

  // Limpiar solo las conversiones
  const handleClearAll = () => {
    // liberar object URLs asociados a las conversiones
    converted.forEach((c) => {
      try {
        URL.revokeObjectURL(c.url);
      } catch {}
    });
    // reiniciar estado de converted
    setConverted([]);
  };

  // Utility: classes condicionales para soportar vertical/horizontal sin duplicar markup.
  const containerClass = `flex ${vertical ? "flex-col items-stretch" : "flex-row items-center"} gap-3`;
  const buttonBase =
    "px-3 py-1 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnSuccess = `${buttonBase} bg-gradient-to-r from-green-400/30 to-emerald-500/30 disabled:cursor-not-allowed`;
  const btnWarning = `${buttonBase} bg-gradient-to-r from-yellow-400/30 to-orange-500/30 disabled:cursor-not-allowed`;
  const btnDanger = `${buttonBase} bg-gradient-to-r from-red-500/30 to-rose-600/30`;
 

  // Cuando se muestran verticalmente, queremos que los botones ocupen todo el ancho para una UX consistente.
  const fullWidthIfVertical = vertical ? "w-full" : "";

  return (
    <div className={containerClass} data-testid="bulk-actions-root" role="group" aria-label="Bulk actions">
      <button
        data-testid="download-all-btn"
        onClick={handleDownloadAll}
        disabled={converted.length === 0}
        className={`${btnSuccess} ${fullWidthIfVertical}`}
        aria-disabled={converted.length === 0}
      >
        Descargar todo (zip)
      </button>

      <button
        data-testid="clear-all-btn"
        onClick={handleClearAll}
        disabled={converted.length === 0}
        className={`${btnWarning} ${fullWidthIfVertical}`}
        aria-disabled={converted.length === 0}
      >
        Limpiar conversiones
      </button>

      <button
        data-testid="remove-all-btn"
        onClick={clearAllFiles}
        className={`${btnDanger} ${fullWidthIfVertical}`}
        title="Eliminar todos los archivos y conversiones"
      >
        Limpiar todo
      </button>
    </div>
  );
}
