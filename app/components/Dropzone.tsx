// app/components/Dropzone.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import ImageCard from "./ImageCard";
import type { ConvertedImage } from "../lib/convert";

type Props = {
  // Callback cuando se agregan archivos (mantiene single source of truth en la page)
  onFilesAdded: (files: File[]) => void;
  // Lista actual de archivos (proporcionada por la page) — opcional, pero necesaria para mostrar previews
  files?: File[];
  // Lista de conversiones para indicar estado en ImageCard (opcional)
  converted?: ConvertedImage[];
  // handlers para acciones sobre cada card (optional — se pasan desde la page)
  onConvert?: (file: File) => Promise<void> | void;
  onRemove?: (file: File) => void;
  globalConverting?: boolean;
};

export default function Dropzone({
  onFilesAdded,
  files = [],
  converted = [],
  onConvert,
  onRemove,
  globalConverting = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * helper: extraer Files desde DataTransferItemList o FileList (sin usar `any`)
   */
  const extractFiles = useCallback(
    (items: DataTransferItemList | FileList | null): File[] => {
      if (!items) return [];

      // Si es un FileList (p. ej. input.files), simplemente convertir a array
      if (
        typeof (items as FileList).item === "function" &&
        (items as FileList) instanceof FileList
      ) {
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

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fl = e.target.files;
      const newFiles = extractFiles(fl);
      if (newFiles.length) onFilesAdded(newFiles);
      // reset input so same file can be added again if needed
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFilesAdded, extractFiles]
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const buttonBase =
    "px-3 py-2 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-purple-500/30 to-pink-500/30 w-xs disabled:cursor-not-allowed`;

  return (
    <div>
      {/* Drop area */}
      <div
        className={`w-full md:h-[100vh] rounded-lg border-2 p-6 transition-colors ${
          isDragging
            ? "border-dashed border-blue-400 bg-white/5"
            : "border-dashed border-white/10 bg-transparent"
        }`}
        // sólo abrir el picker si el click fue directamente sobre la zona (no sobre hijos)
        onClick={(e) => {
          if (e.target === e.currentTarget && files.length === 0) {
            // Si no hay archivos, el input está visible y sirve para seleccionar,
            // pero si quieres que el click sobre la zona abra el picker también cuando input está visible:
            openFilePicker();
          } else if (e.target === e.currentTarget && files.length > 0) {
            // Si ya hay archivos y queremos que click en área abra el picker (botón visible),
            // puedes permitirlo también aquí. Actualmente mantengo comportamiento que solo
            // abre picker por botón cuando hay archivos (seguridad UX).
            // openFilePicker();
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
        {/* INPUT: visible cuando NO hay archivos; oculto después de cargar al menos 1 */}
        {files.length === 0 ? (
          <div className="mb-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              // No 'hidden' aquí: el input es visible hasta que se cargue al menos 1 imagen
              className=" file:hidden text-transparent focus:outline-none"
              onChange={onInputChange}
              data-testid="dropzone-input"
            />
          </div>
        ) : (
          // BOTÓN: visible cuando ya hay al menos 1 archivo; oculto antes
          <div className="mb-4 flex justify-end order-2">
            <button
              type="button"
              onClick={openFilePicker}
              className={btnPrimary}
              data-testid="dropzone-btn"
            >
              Seleccionar más archivos
            </button>
          </div>
        )}

        {/* Placeholder / instrucciones cuando no se muestran cards */}
        {files.length === 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-medium">
                Arrastra y suelta tus imágenes aquí
              </h2>
              <p className="text-sm text-gray-300 mt-2">
                o haz click para seleccionar (PNG/JPG/WEBP)
              </p>
            </div>
          </div>
        )}

        {/* Si hay archivos, mostramos las ImageCard dentro del dropzone */}
        {files && files.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm mb-2">Archivos añadidos:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((file) => (
                <ImageCard
                  key={file.name + file.size}
                  file={file}
                  converted={converted.find(
                    (c) =>
                      c.srcFile.name + c.srcFile.size === file.name + file.size
                  )}
                  onConvert={() =>
                    Promise.resolve(onConvert ? onConvert(file) : undefined)
                  }
                  onRemove={() => onRemove && onRemove(file)}
                  globalConverting={globalConverting}
                  data-testid={`dropzone-image-card-${file.name}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
