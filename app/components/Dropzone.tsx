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

  // helper: extraer Files desde DataTransfer o Input
  const extractFiles = useCallback((items: DataTransferItemList | FileList | null): File[] => {
    if (!items) return [];
    const results: File[] = [];
    if ("length" in items) {
      // FileList or DataTransferItemList
      for (let i = 0; i < items.length; i++) {
        const it = (items as any)[i];
        // if DataTransferItemList, getAsFile may exist
        if (it && typeof it.getAsFile === "function") {
          const f = it.getAsFile();
          if (f) results.push(f);
        } else if (it instanceof File) {
          results.push(it);
        } else if (it && it.kind === "file" && it.getAsFile) {
          const f = it.getAsFile();
          if (f) results.push(f);
        }
      }
    }
    return results;
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dt = e.dataTransfer;
      const newFiles = extractFiles(dt.items.length ? dt.items : dt.files);
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
    "px-3 py-1 rounded-lg backdrop-blur-md cursor-pointer scale-100 hover:scale-105 transition-all text-[12px] md:text-base durattion-200 shadow-md border border-white/20";
  const btnPrimary = `${buttonBase} bg-gradient-to-r from-purple-500/30 to-pink-500/30 w-full disabled:cursor-not-allowed`;

  return (
    <div>
      {/* Drop area */}
      <div
        className={`w-full md:h-[100vh] rounded-lg border-2  p-6 transition-colors ${
          isDragging ? "border-dashed border-blue-400 bg-white/5" : "border-dashed border-white/10 bg-transparent"
        }`}
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
          className="hidden"
          onChange={onInputChange}
          data-testid="dropzone-input"
        />

        {/* Placeholder / instrucciones */}
        <div className="flex items-center  justify-between gap-4 ">
          <div className="flex-1">
            <h2 className="text-lg font-medium">Arrastra y suelta tus imágenes aquí</h2>
            <p className="text-sm text-gray-300">
               o haz click para seleccionar (PNG/JPG).
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={openFilePicker}
              className={btnPrimary}
              data-testid="dropzone-btn"
            >
              Seleccionar archivos
            </button>
          </div>
        </div>

        {/* Si hay archivos, mostramos las ImageCard dentro del dropzone */}
        {files && files.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm mb-2">Archivos añadidos:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((file) => (
                <ImageCard
                  key={file.name + file.size}
                  file={file}
                  converted={converted.find((c) => c.srcFile.name + c.srcFile.size === file.name + file.size)}
                  onConvert={() => Promise.resolve(onConvert ? onConvert(file) : undefined)}
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
