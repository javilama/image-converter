'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
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

export default function ImageCard({
  file,
  converted,
  onConvert,
  onRemove,
  globalConverting = false,
}: Props) {
  const [preview, setPreview] = useState<string>("");
  // estado local para indicar que esta tarjeta está convirtiendo
  const [isConverting, setIsConverting] = useState<boolean>(false);

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
   * Loading:
   * - envolvemos la llamada a `onConvert()` con setIsConverting(true/false)
   * - usamos await onConvert() porque onConvert retorna una Promise desde el padre
   */
  const handleConvertClick = async () => {
    try {
      setIsConverting(true);
      // await la conversión que hace el padre
      await onConvert();
    } catch (err) {
      // manejar error opcionalmente
      console.error('Error en conversión:', err);
    } finally {
      setIsConverting(false);
    }
  };


  return (
    <article
      className="bg-white/5 rounded p-4 flex flex-col "
      data-testid={`card-${file.name}`}
     >
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

      <div className="mt-3 flex-1">
        <p className="font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-sm text-gray-300">
          {Math.round(file.size / 1024)} KB
        </p>
      </div>

      <div className="mt-3 flex gap-4 items-center">
        {/* Botón convertir: deshabilitado mientras isConverting */}
        <button
          data-testid={`convert-btn-${file.name}`}
          className="px-3 py-1 rounded-lg bg-[#C356D7] hover:bg-[#7B2C87] fond-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 scale-100 hover:scale-105 transition-all"
          onClick={handleConvertClick || globalConverting}
          disabled={isConverting}
          aria-busy={isConverting}
          aria-label={isConverting ? 'Convirtiendo imagen' : 'Convertir imagen'}
        >
          {/* Spinner pequeño con Tailwind (sitio exacto del spinner) */}
          {isConverting ? (
            <>
              {/* data-testid para testear el loading */}
              <span data-testid={`convert-loading-${file.name}`} className="inline-block w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              <span>Convirtiendo...</span>
            </>
          ) : (
            <span>Convertir</span>
          )}
        </button>

        {converted && (
          <a
            data-testid={`download-btn-${file.name}`}
            href={converted.url}
            download={converted.filename}
            className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 font-medium cursor-pointer scale-100 hover:scale-105 transition-all"
          >
            Descargar { converted.filename.split('.').pop()?.toUpperCase()}
          </a>
        )}

        <button
          data-testid={`remove-btn-${file.name}`}
          className="px-3 py-1 rounded-lg bg-[#ff0f0f] hover:bg-red-700 ml-auto font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed scale-100 hover:scale-105 transition-all"
          onClick={onRemove}
          // opcional: deshabilitar eliminar mientras convierte
          disabled={isConverting}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
