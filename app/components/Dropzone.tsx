// app/components/Dropzone.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
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
   * Extrae Files desde DataTransferItemList o FileList (sin usar `any`).
   * - Si es FileList -> Array.from
   * - Si es DataTransferItemList -> usar getAsFile()
   */
  const extractFiles = useCallback(
    (items: DataTransferItemList | FileList | null): File[] => {
      if (!items) return [];

      // Si es FileList (p. ej. input.files), devolver array directo
      if ((items as FileList) instanceof FileList) {
        return Array.from(items as FileList);
      }

      const results: File[] = [];
      const dtItems = items as DataTransferItemList;

      for (let i = 0; i < dtItems.length; i++) {
        const it = dtItems[i];
        if (!it) continue;

        // DataTransferItem tiene getAsFile()
        if (typeof (it as DataTransferItem).getAsFile === "function") {
          const f = (it as DataTransferItem).getAsFile();
          if (f) results.push(f);
          continue;
        }

        // Fallback: si por alguna razón el índice devuelve directamente un File
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
    // inputRef siempre existe (está en el DOM aunque oculto visualmente)
    inputRef.current?.click();
  }, []);

  const buttonBase =
    "px-3 py-2 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-purple-500/30 to-pink-500/30 disabled:cursor-not-allowed`;
  

  return (
    <div>
      {/* Drop area */}
      <div
        className={`w-full min-h-screen rounded-lg border-2 p-6 transition-colors ${
          isDragging
            ? "border-dashed border-blue-400 bg-white/5"
            : "border-dashed border-white/10 bg-transparent"
        }`}
        // solo abrir el picker si el click fue directamente sobre la zona (no sobre hijos)
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
        {/* INPUT: siempre presente en el DOM pero oculto visualmente con sr-only
            -> evita que el navegador muestre el texto nativo "Elegir archivos / Sin archivo seleccionado"
            -> mantiene inputRef disponible para openFilePicker()
        */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={onInputChange}
          data-testid="dropzone-input"
        />

        {/* Controles visibles:
            - Si no hay archivos: CTA visual (div role=button) que abre el picker (sin mostrar el input nativo)
            - Si hay archivos: botón para "Seleccionar más archivos"
        */}
        {files.length === 0 ? (
          <div className="mb-4">
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                // evitar abrir si se hace click sobre un hijo interactivo
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

              {/* <div className="px-3 py-2 rounded bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-sm">
                Seleccionar
              </div> */}
            </div>
          </div>
        ) : (
          // boton cargar mas imagenes
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

        {/* Si hay archivos, mostramos las ImageCard dentro del dropzone */}
        {files && files.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs mb-2">
              Ingresa un nombre para tu imagen (opcional).
              <br />
              Al salir del campo, se ajustará automáticamente eliminando
              caracteres no válidos y reemplazando espacios por guiones.
            </h3>

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
