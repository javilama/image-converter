"use client";

import { useCallback, useRef, DragEvent } from "react";

type Props = {
  onFilesAdded: (files: File[]) => void;
};

export default function Dropzone({ onFilesAdded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // normalizar y filtrar archivos (solo imágenes)
  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const arr = Array.from(list).filter((f) =>
        /image\/(png|jpeg|jpg)/i.test(f.type)
      );
      if (arr.length) onFilesAdded(arr);
    },
    [onFilesAdded]
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onSelect = useCallback(() => {
    handleFiles(inputRef.current?.files ?? null);
  }, [handleFiles]);

  return (
    <div
      data-testid="dropzone-area"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-dashed border-2 border-white/20 rounded-lg p-6 text-center cursor-pointer h-[30vh]"
      onClick={() => inputRef.current?.click()}
    >
      <input
        data-testid="dropzone-input"
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg"
        multiple
        className="hidden"
        onChange={onSelect}
      />
      <p className="text-sm md:text-xl text-white/50">
        Arrastra y suelta imágenes aquí o haz click para seleccionar (PNG/JPG).
      </p>
    </div>
  );
}
