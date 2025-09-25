"use client";

import React from "react";

type Props = {
  targetFormat: "webp" | "png" | "jpg";
  onChangeFormat: (f: "webp" | "png" | "jpg") => void;
  onConvertAll: () => void;
  hasFiles: boolean;
  isConvertingAll?: boolean;
  convertProgress?: { current: number; total: number };
};

export default function Toolbar({
  targetFormat,
  onChangeFormat,
  onConvertAll,
  hasFiles,
  isConvertingAll = false,
  convertProgress = { current: 0, total: 0 },
}: Props) {
  return (
    <div
      className="flex items-center justify-between mb-4 gap-3"
      data-testid="toolbar-root"
    >
      <div className="flex gap-3 items-center">
        <label className="text-sm md:text-xl">Formato de salida:</label>
        <select
          data-testid="format-select"
          value={targetFormat}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value;
            if (val === "webp" || val === "png" || val === "jpg") {
              onChangeFormat(val);
            }
          }}
          className="bg-white/15 rounded px-3 py-1 text-xs md:text-base"
          disabled={isConvertingAll}
        >
          <option className="text-[#000000] text-xs md:text-base" value="webp">
            WEBP (recomendado)
          </option>
          <option className="text-[#000000] text-xs md:text-base" value="png">
            PNG
          </option>
          <option className="text-[#000000] text-xs md:text-base" value="jpg">
            JPG
          </option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        {/* Mostrar progreso y spinner cuando isConvertingAll es true */}
        {isConvertingAll ? (
          <div
            className="flex items-center gap-2"
            data-testid="convert-all-progress"
          >
            <span className="inline-block w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">
              Convirtiendo {convertProgress.current} / {convertProgress.total}
            </span>
          </div>
        ) : null}

        <button
          data-testid="convert-all-btn"
          onClick={onConvertAll}
          disabled={!hasFiles || isConvertingAll}
          className="px-4 py-2 rounded-lg md:rounded-full bg-[#07bc77]/60 disabled:opacity-60 cursor-pointer font-light text-xs md:text-xl scale-100 hover:scale-105 transition-all"
        >
          {isConvertingAll ? "Convirtiendo todo..." : "Convertir todo"}
        </button>
      </div>
    </div>
  );
}
