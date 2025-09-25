"use client";

import { useEffect, useState } from "react";
import { ConvertedImage, fileToDataUrl } from "../lib/convert";
import "../globals.css";

type Props = {
  file: File;
  converted?: ConvertedImage;
  // onConvert ahora devuelve una Promise para que el card pueda await
  onConvert: () => Promise<void>;
  onRemove: () => void;
  globalConverting?: boolean;
};

/**
 * 🔹 Utilidad para sanitizar el nombre (eliminar espacios/caracteres raros, normalizar acentos)
 *
 * - Quita la extensión si el usuario por error la incluye.
 * - Normaliza diacríticos (NFKD) y elimina marcas.
 * - Mantiene letras, números, guiones y underscores.
 * - Reemplaza espacios por guiones y devuelve en minúsculas.
 * - Retorna 'archivo' si el resultado queda vacío.
 */
function sanitizeFilename(name: string): string {
  if (!name) return "archivo";
  // 1) quitar extensión si existe
  const withoutExt = name.replace(/\.[^.]+$/, "");
  // 2) normalizar diacríticos (NFKD) y eliminar marcas
  const normalized = withoutExt.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  // 3) eliminar caracteres no deseados, permitir letras, números, guiones, underscores y espacios
  const cleaned = normalized.replace(/[^\w\s-]/g, "").trim();
  // 4) reemplazar espacios por guiones y pasar a minúsculas
  const slug = cleaned.replace(/\s+/g, "-").toLowerCase();
  return slug || "archivo";
}

export default function ImageCard({
  file,
  converted,
  onConvert,
  onRemove,
  globalConverting = false,
}: Props) {
  const [preview, setPreview] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // nuevo: estado para nombre personalizado
  const [customName, setCustomName] = useState<string>("");

  useEffect(() => {
    let alive = true;
    fileToDataUrl(file).then((url) => {
      if (alive) setPreview(url);
    });
    return () => {
      alive = false;
    };
  }, [file]);

  /**
   * Maneja conversión con loading controlado
   */
  const handleConvertClick = async () => {
    try {
      setIsConverting(true);
      await onConvert(); // ejecuta conversión en el padre
    } catch (err) {
      console.error("Error en conversión:", err);
    } finally {
      setIsConverting(false);
    }
  };

  /**
   * 🔹 Construcción segura del nombre final:
   * - Usa customName si está definido y no vacío (normalizado).
   * - Si está vacío → usa el nombre base original (sin extensión) normalizado.
   */
  const getDownloadFilename = (): string => {
    const fallbackBase = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""));
    // siempre normalizamos el customName en el momento de crear el filename (doble seguridad)
    const safeCustom = customName ? sanitizeFilename(customName) : "";
    const safeName = safeCustom || fallbackBase;
    const ext = converted?.filename.split(".").pop() || "png";
    return `${safeName}.${ext}`;
  };

  const buttonBase =
    "px-3 py-1 flex items-center rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-xs durattion-200 shadow-md border border-white/20";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-purple-500/30 to-pink-500/30  disabled:cursor-not-allowed gap-2`;
  const btnSuccess = `${buttonBase} bg-gradient-to-r from-green-400/30 to-emerald-500/30 disabled:cursor-not-allowed`;
  const btnDanger = `${buttonBase} bg-gradient-to-r from-red-500/30 to-rose-600/30`;

  return (
    <article
      className="bg-white/5 rounded-lg p-4 flex flex-col"
      data-testid={`card-${file.name}`}
    >
      {/* Vista previa */}
      <div className="h-48 flex items-center justify-center bg-black/20 rounded">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div>Preview...</div>
        )}
      </div>

      {/* Información + campo de nombre */}
      <div className="mt-3 flex-1">
        <p className="text-sm text-gray-300 mb-2">
          {Math.round(file.size / 1024)} KB
        </p>

        {/* 
          FIX: prevenir que eventos del input burbujen al Dropzone padre 
          (onKeyDown, onClick, onFocus) -> stopPropagation.
          Normalizar el nombre cuando el usuario sale del input (onBlur).
        */}
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onBlur={(e) => {
            // normalizar al perder foco para retroalimentación inmediata
            const normalized = sanitizeFilename(e.target.value);
            setCustomName(normalized);
          }}
          placeholder={file.name.replace(/\.[^.]+$/, "")}
          className="w-full px-2 py-1 rounded-lg bg-black/30 border border-gray-600 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 "
          onKeyDown={(e) => {
            // evitar que teclas como Space/Enter burbujen y activen el Dropzone
            e.stopPropagation();
          }}
          onClick={(e) => {
            // evitar que el click abra el file picker en el padre
            e.stopPropagation();
          }}
          onFocus={(e) => {
            // evitar que el foco en el input provoque handlers en el padre
            e.stopPropagation();
          }}
          onPaste={(e) => {
            // prevenir paste brusco y normalizar al pegar (dejar que se inserte y normalizar en onBlur)
            e.stopPropagation();
          }}
          onDrop={(e) => {
            // prevenir drop dentro del input que también puede burbujar
            e.stopPropagation();
          }}
        />
      </div>

      {/* Acciones */}
      <div className="mt-3 flex gap-4 items-center">
        {/* Botón convertir */}
        <button
          data-testid={`convert-btn-${file.name}`}
          className={btnPrimary}
          onClick={handleConvertClick}
          disabled={isConverting || globalConverting}
          aria-busy={isConverting}
          aria-label={isConverting ? "Convirtiendo imagen" : "Convertir imagen"}
        >
          {isConverting ? (
            <>
              <span
                data-testid={`convert-loading-${file.name}`}
                className="inline-block w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"
              />
              <span>Convirtiendo...</span>
            </>
          ) : (
            <span>Convertir</span>
          )}
        </button>

        {/* Botón descargar si está convertido */}
        {converted && (
          <a
            data-testid={`download-btn-${file.name}`}
            href={converted.url}
            // Usamos el nombre normalizado (getDownloadFilename) para la descarga
            download={getDownloadFilename()}
            className={btnSuccess}
          >
            Descargar {converted.filename.split(".").pop()?.toUpperCase()}
          </a>
        )}

        {/* Botón eliminar */}
        <button
          data-testid={`remove-btn-${file.name}`}
          className={btnDanger}
          onClick={onRemove}
          disabled={isConverting}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
