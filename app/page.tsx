"use client";

import React, { useState, useCallback } from "react";
import Dropzone from "../app/components/Dropzone";
import ImageCard from "../app/components/ImageCard";
import Toolbar from "../app/components/Toolbar";
import BulkActions from "../app/components/BulkAction";
import { ConvertedImage } from "../app/lib/convert";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [converted, setConverted] = useState<ConvertedImage[]>([]);
  const [targetFormat, setTargetFormat] = useState<"webp" | "png" | "jpg">(
    "webp"
  );

  // Estado para la conversión global (Convertir todo)
  const [isConvertingAll, setIsConvertingAll] = useState<boolean>(false);
  // Progreso: { current: n, total: m } para mostrar "3 / 10"
  const [convertProgress, setConvertProgress] = useState<{
    current: number;
    total: number;
  }>({ current: 0, total: 0 });

  const handleAddFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      const existing = new Map(prev.map((f) => [f.name + f.size, f]));
      newFiles.forEach((f) => existing.set(f.name + f.size, f));
      return Array.from(existing.values());
    });
  }, []);

  // Convierte un único archivo (devuelve Promise<void>)
  const handleConvertFile = useCallback(
    async (file: File): Promise<void> => {
      const { convertFileTo } = await import("../app/lib/convert");
      const result = await convertFileTo(file, targetFormat, { quality: 0.9 });
      setConverted((prev) => [
        ...prev.filter(
          (c) => c.srcFile.name + c.srcFile.size !== file.name + file.size
        ),
        result,
      ]);
    },
    [targetFormat]
  );

  const handleConvertAll = useCallback(async () => {
    if (!files.length) return;
    // opción segura: convertir secuencialmente para evitar picos de memoria
    setIsConvertingAll(true);
    setConvertProgress({ current: 0, total: files.length });

    try {
      const { convertFileTo } = await import("../app/lib/convert");
      const results: ConvertedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        // convertir uno por uno (await) — actualiza UI en cada iteración
        const r = await convertFileTo(f, targetFormat, { quality: 0.9 });
        // guardar en el estado de converted progresivamente
        setConverted((prev) => {
          const filtered = prev.filter(
            (c) => c.srcFile.name + c.srcFile.size !== f.name + f.size
          );
          return [...filtered, r];
        });
        results.push(r);
        // actualizar progreso
        setConvertProgress({ current: i + 1, total: files.length });
      }
    } catch (err) {
      console.error("Error en Convertir todo:", err);
      // aquí puedes mostrar un toast / alerta si deseas
    } finally {
      setIsConvertingAll(false);
      setTimeout(() => setConvertProgress({ current: 0, total: 0 }), 400); // opcional: limpiar indicador después
    }
  }, [files, targetFormat]);

  const handleRemoveFile = useCallback((file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file));
    setConverted((prev) => prev.filter((c) => c.srcFile !== file));
  }, []);
  const handleClearAllFiles = useCallback(() => {
    // liberar object URLs
    converted.forEach((c) => {
      try {
        URL.revokeObjectURL(c.url);
      } catch {}
    });

    setFiles([]); // elimina todos los archivos cargados
    setConverted([]); // limpia las conversiones
  }, [converted]);

  return (
    <main className="container mx-auto mt-20 mb-20 p-6">
      <h1 className="text-3xl font-semibold mb-4" data-testid="title">
        Convertidor de imágenes
      </h1>
      <Toolbar
        targetFormat={targetFormat}
        onChangeFormat={setTargetFormat}
        onConvertAll={handleConvertAll}
        hasFiles={files.length > 0}
        // nuevos props para mostrar estado y progreso
        isConvertingAll={isConvertingAll}
        convertProgress={convertProgress}
        data-testid="toolbar"
      />
     <div className=" flex justify-end  mt-8 mb-4 ">
        <BulkActions
          converted={converted}
          setConverted={setConverted}
          data-testid="bulk-actions"
          clearAllFiles={handleClearAllFiles}
        />
      </div>
      <Dropzone onFilesAdded={handleAddFiles} data-testid="dropzone" />

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <ImageCard
            key={file.name + file.size}
            file={file}
            converted={converted.find(
              (c) => c.srcFile.name + c.srcFile.size === file.name + file.size
            )}
            // PASO EXACTO: pasar la función que devuelve Promise (ImageCard hace await)
            onConvert={() => handleConvertFile(file)}
            onRemove={() => handleRemoveFile(file)}
            // deshabilitar conversiones individuales si se está convirtiendo todo
            globalConverting={isConvertingAll}
            data-testid={`image-card-${file.name}`}
          />
        ))}
      </section>

      <div className="mt-8">
        <BulkActions
          converted={converted}
          setConverted={setConverted}
          data-testid="bulk-actions"
          clearAllFiles={handleClearAllFiles}
        />
      </div>
    </main>
  );
}
