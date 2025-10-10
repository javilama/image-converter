// app/components/Dropzone.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import ImageCard from "./ImageCard";
import type { ConvertedImage } from "../lib/convert";

// --- Definición de Props ---

type Props = {
  onFilesAdded: (files: File[]) => void;
  files?: File[];
  converted?: ConvertedImage[];
  onConvert?: (file: File) => Promise<void> | void;
  onRemove?: (file: File) => void;
  globalConverting?: boolean;
  names?: Record<string, string>;
  onCustomNameChange?: (file: File, name: string) => void;
};

// --- Componente Principal ---
export default function Dropzone({
  onFilesAdded,
  files = [],
  onConvert,
  onRemove,
  globalConverting = false,

}: Props) {

  // ---estado interno---
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Genera una clave única para cada archivo basado en nombre y tamaño
  const getKey = (file: File) => `${file.name}-${file.size}`;

  // --- Funciones Auxiliares ---
  // Extrae archivos de DataTransferItemList o FileList

  const extractFiles = useCallback(
    (items: DataTransferItemList | FileList | null): File[] => {
      if (!items) return [];

      if ((items as FileList) instanceof FileList) {
        return Array.from(items as FileList);
      }

      const results: File[] = [];
      const dtItems = items as DataTransferItemList;

      for (let i = 0; i < dtItems.length; i++) {
        const it = dtItems[i];
        if (!it) continue;

        if (typeof (it as DataTransferItem).getAsFile === "function") {
          const f = (it as DataTransferItem).getAsFile();
          if (f) results.push(f);
          continue;
        }

        if ((it as unknown) instanceof File) {
          results.push(it as unknown as File);
        }
      }

      return results;
    },
    []
  );
// --- Manejadores de eventos ---
// Manejador del evento drop
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dt = e.dataTransfer;
      const newFiles = extractFiles(
        dt.items && dt.items.length ? dt.items : dt.files
      );
      if (newFiles.length) onFilesAdded(newFiles);
    },
    [onFilesAdded, extractFiles]
  );
// Manejador del evento dragover
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);
// Manejador del evento dragleave
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
// Manejador del cambio en el input file
  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fl = e.target.files;
      const newFiles = extractFiles(fl);
      if (newFiles.length) onFilesAdded(newFiles);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFilesAdded, extractFiles]
  );
// Abre el selector de archivos
  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // --- Estilos ---
  const buttonBase =
    "px-3 py-2 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-yellow-400/30 to-orange-400/30 disabled:cursor-not-allowed hover:from-yellow-500/30 hover:to-orange-500/30`;

  

  return (
    <div>
      <div
        className={`w-full min-h-screen rounded-lg border-2 p-6 transition-colors ${
          isDragging
            ? "border-dashed border-teal-200/30 bg-white/5"
            : "border-dashed border-white/10 bg-transparent"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            openFilePicker();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            openFilePicker();
          }
        }}
        aria-label="Area para arrastrar o seleccionar imágenes"
        data-testid="dropzone-root"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={onInputChange}
          data-testid="dropzone-input"
        />

        {files.length === 0 ? (
          <div className="mb-4">
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (e.target === e.currentTarget) openFilePicker();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openFilePicker();
              }}
              className="w-full cursor-pointer rounded-lg p-6 flex items-center justify-between gap-4"
              data-testid="dropzone-cta"
            >
              <div className="flex-1 text-left">
                <h2 className="text-lg font-medium">
                  Arrastra y suelta tus imágenes aquí
                </h2>
                <p className="text-sm text-gray-300 mt-2">
                  Haz click o presiona Enter para seleccionar (PNG/JPG/WEBP)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={openFilePicker}
              className={btnPrimary}
              data-testid="dropzone-btn"
              title="Agregar más imágenes"
            >
              <FaArrowUpFromBracket className="w-5 h-5 text-white/50 hover:text-white/90" />
            </button>
          </div>
        )}

        {files && files.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs mb-2">
              Ingresa un nombre para tu imagen (opcional).
              <br />
              Al salir del campo, se ajustará automáticamente eliminando
              caracteres no válidos y reemplazando espacios por guiones.
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((file) => {
                const key = getKey(file);
                return (
                  <ImageCard
                    key={key}
                    file={file}
                    onConvert={() =>
                      Promise.resolve(onConvert ? onConvert(file) : undefined)
                    }
                    onRemove={() => onRemove && onRemove(file)}
                    globalConverting={globalConverting}
                    data-testid={`dropzone-image-card-${file.name}`}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
