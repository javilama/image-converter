// app/components/Toolbar.tsx
"use client";

import CustomSelect from "./CustomSelect";

// --- Definición de Props ---
type Props = {
  targetFormat: "webp" | "png" | "jpg";
  onChangeFormat: (f: "webp" | "png" | "jpg") => void;
  onConvertAll: () => void;
  allowedFormats?: string[];
  hasFiles: boolean;
  isConvertingAll?: boolean;
  convertProgress?: { current: number; total: number };
};
// --- Componente Principal ---
export default function Toolbar({
  targetFormat,
  onChangeFormat,
  onConvertAll,
  hasFiles,
  allowedFormats,
  isConvertingAll = false,
  convertProgress = { current: 0, total: 0 },
}: Props) {

  // --- Estilos ---
  const buttonBase =
    "px-3 py-1 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20 w-full ";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-yellow-500/30 to-orange-500/30 disabled:cursor-not-allowed`;
  const disabledClass = "opacity-50 cursor-not-allowed pointer-events-none";

// Progreso de conversión
  const progress = convertProgress ?? { current: 0, total: 0 };
// Maneja el clic en "Convertir todo"
  const handleConvertAll = () => {
    const allowed = allowedFormats ?? ["webp", "png", "jpg"];
    const normalized = String(targetFormat).toLowerCase().trim();
    if (!allowed.map(a => a.toLowerCase().trim()).includes(normalized)) {
      console.log(`[Toolbar] Formato "${targetFormat}" no admitido.`);
      return;
    }
    onConvertAll();
  };
// --- Renderizado ---
  return (
    <div className="flex items-center justify-between mb-4 gap-3 " data-testid="toolbar-root">
      <div className="flex flex-col gap-5 items-center w-full ">
        <label className="text-sm md:text-xl">Formato de salida:</label>
          {/* Selector de formato*/}
        <CustomSelect
          targetFormat={targetFormat}
          onChangeFormat={onChangeFormat}
          isConvertingAll={isConvertingAll}
          className="w-full"
          data-testid="format-select"
        />
          {/* Botón de convertir todo */}
        <div className="flex flex-col items-center gap-3 w-[100%]">
          {/* renderizado condicional*/}
          {isConvertingAll ? (
            <div className="flex items-center gap-2" data-testid="convert-all-progress">
              <span className="inline-block w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm md:text-base bg-clip-text text-transparent bg-gradient-to-r from-yellow-500/70 to-orange-500/70 animate-pulse">
                Convirtiendo {progress.current} / {progress.total}
              </span>
            </div>
          ) : null}
          
          <button
            data-testid="convert-all-btn"
            onClick={handleConvertAll}
            disabled={!hasFiles || isConvertingAll}
            className={`${btnPrimary} ${(!hasFiles || isConvertingAll) ? disabledClass : ""}`}
            aria-busy={isConvertingAll}
            aria-disabled={!hasFiles || isConvertingAll}
            title={isConvertingAll ? "Convirtiendo todo..." : "Convertir todo"}
          >
            {isConvertingAll ? "Convirtiendo todo..." : "Convertir todo"}
          </button>
        </div>
      </div>
    </div>
  );
}
