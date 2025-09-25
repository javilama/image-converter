'use client';

import { ConvertedImage } from "../lib/convert";
import { zipFiles } from "../lib/zip";

type Props = {
  converted: ConvertedImage[];
  // setter para actualizar el array de conversiones (ej: limpiar)
  setConverted: (arr: ConvertedImage[]) => void;
  // nuevo prop para limpiar también los archivos originales
  clearAllFiles: () => void;
};

/**
 * BulkActions
 *
 * Botones para:
 * - Descargar todas las imágenes convertidas en un ZIP.
 * - Limpiar solo las conversiones (liberar object URLs).
 * - Eliminar todo: archivos cargados y conversiones (reinicio completo).
 */
export default function BulkActions({ converted, setConverted, clearAllFiles }: Props) {
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
    converted.forEach((c) => {
      try {
        URL.revokeObjectURL(c.url);
      } catch {}
    });
    setConverted([]);
  };

  return (
    <div className="flex gap-3" data-testid="bulk-actions-root">
      <button
        data-testid="download-all-btn"
        onClick={handleDownloadAll}
        disabled={converted.length === 0}
        className="px-4 py-2 font-light rounded-lg bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base"
      >
        Descargar todas (zip)
      </button>

      <button
        data-testid="clear-all-btn"
        onClick={handleClearAll}
        disabled={converted.length === 0}
        className="px-4 py-2 font-medium rounded-lg bg-[#ff4545] hover:bg-[#ff0f0f]disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base"
      >
        Limpiar conversiones
      </button>

      <button
        data-testid="remove-all-btn"
        onClick={clearAllFiles}
        className="px-4 py-2 font-medium rounded-lg bg-[#ff0f0f] hover:bg-red-700 cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base"
        title="Eliminar todos los archivos y conversiones"
      >
        Limpiar todo
      </button>
    </div>
  );
}
