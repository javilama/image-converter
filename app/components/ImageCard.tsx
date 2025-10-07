// app/components/ImageCard.tsx
"use client";

import { useEffect, useState } from "react";
import { fileToDataUrl } from "../lib/convert";
import { FaArrowsRotate, FaArrowDownLong, FaTrashCan } from "react-icons/fa6";
import LoadingSpinner from "./LoadingSpinner";
import "../globals.css";
import { useImageStore, getKey, sanitizeFilenameForDownload } from '../store/useImageStore';


/// --- Definición de Props ---
type Props = {
  file: File;
  onConvert: () => Promise<void>;
  onRemove: () => void;
  globalConverting?: boolean;
  // PROPS para estado elevado (controlado por el padre)
  
};


/// --- Componente Principal ---
export default function ImageCard({
  // FIRMA de la función
  file,
  onConvert,
  onRemove,
  globalConverting = false,
}: Props) {

  // Estado interno
  const [preview, setPreview] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // ESTADO ELEVADO EN Store (controlado por el padre)
  const key = getKey(file);
  const customName = useImageStore(s => s.names[key] ?? file.name.replace(/\.[^.]+$/, ""));
  const setCustomName = useImageStore(s => s.setCustomName);
  const converted = useImageStore(s => s.converted.find(c => getKey(c.srcFile) === getKey(file)));
  const targetFormat = useImageStore(s => s.targetFormat);

  // Efecto para generar la vista previa al montar el componente

  useEffect(() => {
    let alive = true;
    fileToDataUrl(file).then((url) => {
      if (alive) setPreview(url);
    });
    return () => {
      alive = false;
    };
  }, [file]);

  // Manejador del clic de conversión
  const handleConvertClick = async () => {
    try {
      setIsConverting(true);
      await onConvert();
    } catch (err) {
      console.error("Error en conversión:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // Generar nombre de la descarga basado en nombre personalizado u original
  const getDownloadFilename = (): string => {
   const safeBase = sanitizeFilenameForDownload(customName || file.name.replace(/\.[^.]+$/, ""), file.name);
    const ext =
      converted?.filename.split(".").pop() ||
      file.name.split(".").pop() || targetFormat ||
      "png";
    return `${safeBase}.${ext}`;
  };

// --- Estilos ---
  const buttonBase =
    "px-3 py-2 flex items-center justify-center backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-xs durattion-200 shadow-md border border-white/20";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-purple-500/30 to-pink-500/30 disabled:cursor-not-allowed w-[20%] rounded-s-lg`;
  const btnSuccess = `${buttonBase} bg-gradient-to-r from-green-400/30 to-emerald-500/30 disabled:cursor-not-allowed gap-2`;
  const btnDanger = `${buttonBase} bg-gradient-to-r from-red-500/30 to-rose-600/30 w-[20%] rounded-e-lg`;
  const iconBlur = "hover:text-white/90 text-white/50 w-4 h-4";


  // --- Renderizado ---
  return (
    <article
      className="bg-white/5 rounded-lg p-5 flex flex-col"
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

          // Si no hay preview, muestra un spinner de carga (componente: LoadingSpinner)
          <LoadingSpinner size="md" label="Cargando vista previa..." />
        )}
      </div>

      {/* Información + campo de nombre */}
      <div className="mt-3 flex-1">
        <p className="text-sm text-gray-300 mb-2">
          {Math.round(file.size / 1024)} KB
        </p>

        <input
          type="text"
          value={customName || file.name.replace(/\.[^.]+$/, "")}
          onChange={
            (e)=> setCustomName(file, e.target.value)
          }
          onBlur={(e) => {
            const normalized = sanitizeFilenameForDownload(e.target.value, file.name).replace(/\.[^.]+$/, "");
            setCustomName(file, normalized);
          }}
          placeholder={file.name.replace(/\.[^.]+$/, "")}
          className="w-full px-2 py-1 rounded-lg bg-black/30 border border-gray-600 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 "
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onDrop={(e) => e.stopPropagation()}
        />
      </div>

      {/* Acciones */}
      <div className="mt-3 flex items-center justify-center" role="group">
        <button
          data-testid={`convert-btn-${file.name}`}
          className={btnPrimary}
          onClick={handleConvertClick}
          disabled={isConverting || globalConverting}
          aria-busy={isConverting}
          aria-label={isConverting ? "Convirtiendo imagen" : "Convertir imagen"}
          title="Convertir"
        >
          {isConverting ? (
            <>
              <span
                data-testid={`convert-loading-${file.name}`}
                className="inline-block w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"
              />
              <span> </span>
            </>
          ) : (
            <span>
              <FaArrowsRotate className={iconBlur} />
            </span>
          )}
        </button>

        {converted && (
          <a
            data-testid={`download-btn-${file.name}`}
            href={converted.url}
            download={getDownloadFilename()}
            className={btnSuccess}
            title="Descargar imagen convertida"
          >
            <FaArrowDownLong className={iconBlur} />
            {converted.filename.split(".").pop()?.toUpperCase()}
          </a>
        )}

        <button
          data-testid={`remove-btn-${file.name}`}
          className={btnDanger}
          onClick={onRemove}
          disabled={isConverting}
          title="Eliminar imagen"
        >
          <FaTrashCan className={iconBlur} />
        </button>
      </div>
    </article>
  );
}
