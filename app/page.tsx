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
  const [targetFormat, setTargetFormat] = useState<"webp" | "png" | "jpg">("webp");

  const [isConvertingAll, setIsConvertingAll] = useState<boolean>(false);
  const [convertProgress, setConvertProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const [names, setNames] = useState<Record<string, string>>({});
  const getKey = (file: File) => `${file.name}-${file.size}`;

  function sanitizeFilenameForDownload(name: string, originalName: string): string {
    const baseName = name && name.trim() !== "" ? name : originalName;
    const withoutExt = baseName.replace(/\.[^.]+$/, "");
    const normalized = withoutExt.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const cleaned = normalized.replace(/[^\w\s-]/g, "").trim();
    const slug = cleaned.replace(/\s+/g, "-").toLowerCase();
    return slug || originalName.replace(/\.[^.]+$/, "");
  }

  const handleAddFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      const existing = new Map(prev.map((f) => [getKey(f), f]));
      newFiles.forEach((f) => existing.set(getKey(f), f));
      const merged = Array.from(existing.values());

      setNames((prevNames) => {
        const next = { ...prevNames };
        const mergedKeys = new Set(merged.map((f) => getKey(f)));
        Object.keys(next).forEach((k) => {
          if (!mergedKeys.has(k)) delete next[k];
        });
        merged.forEach((f) => {
          const k = getKey(f);
          if (!(k in next)) next[k] = f.name.replace(/\.[^.]+$/, "");
        });
        return next;
      });

      return merged;
    });
  }, []);

  const handleConvertFile = useCallback(
    async (file: File): Promise<void> => {
      const { convertFileTo } = await import("../app/lib/convert");
      const result = await convertFileTo(file, targetFormat, { quality: 0.9 });

      const key = getKey(file);
      const controlledBase = names[key] ?? file.name.replace(/\.[^.]+$/, "");
      const ext = result.filename?.split(".").pop() || targetFormat || file.name.split(".").pop() || "png";
      const safeBase = sanitizeFilenameForDownload(controlledBase, file.name);
      const newFilename = `${safeBase}.${ext}`;

      const adjusted: ConvertedImage = { ...result, filename: newFilename };

      setConverted((prev) => {
        const filtered = prev.filter((c) => `${c.srcFile.name}-${c.srcFile.size}` !== getKey(file));
        return [...filtered, adjusted];
      });
    },
    [targetFormat, names]
  );

  const handleConvertAll = useCallback(async () => {
    if (!files.length) return;
    setIsConvertingAll(true);
    setConvertProgress({ current: 0, total: files.length });

    try {
      const { convertFileTo } = await import("../app/lib/convert");
      const results: ConvertedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const r = await convertFileTo(f, targetFormat, { quality: 0.9 });

        const key = getKey(f);
        const controlledBase = names[key] ?? f.name.replace(/\.[^.]+$/, "");
        const ext = r.filename?.split(".").pop() || targetFormat || f.name.split(".").pop() || "png";
        const safeBase = sanitizeFilenameForDownload(controlledBase, f.name);
        const newFilename = `${safeBase}.${ext}`;
        const adjusted: ConvertedImage = { ...r, filename: newFilename };

        results.push(adjusted);
        setConvertProgress({ current: i + 1, total: files.length });
      }

      setConverted((prev) => {
        const filtered = prev.filter(
          (c) => !results.some((res) => `${res.srcFile.name}-${res.srcFile.size}` === `${c.srcFile.name}-${c.srcFile.size}`)
        );
        return [...filtered, ...results];
      });
    } catch (err) {
      console.error("Error en Convertir todo:", err);
    } finally {
      setIsConvertingAll(false);
      setTimeout(() => setConvertProgress({ current: 0, total: 0 }), 400);
    }
  }, [files, targetFormat, names]);

  const handleRemoveFile = useCallback((file: File) => {
    setFiles((prev) => prev.filter((f) => getKey(f) !== getKey(file)));
    setConverted((prev) => prev.filter((c) => `${c.srcFile.name}-${c.srcFile.size}` !== getKey(file)));
    setNames((prev) => {
      const n = { ...prev };
      delete n[getKey(file)];
      return n;
    });
  }, []);

  const handleClearAllFiles = useCallback(() => {
    converted.forEach((c) => {
      try { URL.revokeObjectURL(c.url); } catch {}
    });
    setFiles([]);
    setConverted([]);
    setNames({});
  }, [converted]);

  const handleCustomNameChange = useCallback((file: File, name: string) => {
    setNames((prev) => ({ ...prev, [getKey(file)]: name }));
  }, []);

 // Handler en Home: recibe params desde BulkActions -> RenameAllButton -> RenameModal
const applyRenameAll = useCallback((params: { prefix: string; name: string; keyType: "index" | "original" | "counter"; }) => {
  const { prefix, name, keyType } = params;

  // construir nuevo map de names basado en files
  setNames((prev) => {
    const next: Record<string, string> = {};
    let counter = Date.now(); // para keyType 'counter' usar timestamp base
    files.forEach((f, idx) => {
      const origBase = f.name.replace(/\.[^.]+$/, "");
      let keySuffix = "";

      if (keyType === "index") {
        keySuffix = `${idx + 1}`;
      } else if (keyType === "original") {
        keySuffix = origBase;
      } else {
        // counter
        keySuffix = `${counter + idx}`; // simple y único
      }

      // construir base final: prefix + name + '-' + keySuffix (omitir partes vacías inteligentemente)
      const parts = [];
      if (prefix && prefix.trim() !== "") parts.push(prefix.trim());
      if (name && name.trim() !== "") parts.push(name.trim());
      if (keySuffix && keySuffix.trim() !== "") parts.push(keySuffix.trim());
      const combined = parts.join("-");

      // sanear
      const safe = sanitizeFilenameForDownload(combined, origBase);
      next[getKey(f)] = safe;
    });

    return next;
  });

  // sincronizar converted filenames inmediatamente para que ZIP y descargas reflejen el cambio
  setConverted((prev) =>
    prev.map((c, i) => {
      const k = getKey(c.srcFile);
      const base = (names[k] ?? c.srcFile.name.replace(/\.[^.]+$/, "")) || c.srcFile.name.replace(/\.[^.]+$/, "");
      // preferir new name from setNames: but setNames is async — use previous approach by reading current files map
      // safer: derive from files array by matching srcFile
      const fileForThis = files.find((f) => `${f.name}-${f.size}` === `${c.srcFile.name}-${c.srcFile.size}`);
      const baseFromNames = fileForThis ? ( ( (typeof window !== "undefined") && ( (window as any).__names_cache ) ) ? "" : "" ) : base;
      // simpler: compute new base same way as in setNames (but we don't have params per-file here) -> fallback to names after setNames completes
      // To keep it deterministic, recompute using current files order and same params:
      let idx = files.findIndex((f) => `${f.name}-${f.size}` === `${c.srcFile.name}-${c.srcFile.size}`);
      if (idx === -1) idx = i;
      let keySuffix = keyType === "index" ? `${idx + 1}` : keyType === "original" ? c.srcFile.name.replace(/\.[^.]+$/, "") : `${Date.now() + idx}`;
      const parts = [];
      if (prefix && prefix.trim() !== "") parts.push(prefix.trim());
      if (name && name.trim() !== "") parts.push(name.trim());
      if (keySuffix && keySuffix.trim() !== "") parts.push(keySuffix.trim());
      const combined = parts.join("-");
      const safe = sanitizeFilenameForDownload(combined, c.srcFile.name.replace(/\.[^.]+$/, ""));
      const ext = c.filename.split(".").pop() || targetFormat || "png";
      return { ...c, filename: `${safe}.${ext}` };
    })
  );
}, [files, getKey, sanitizeFilenameForDownload, setNames, setConverted, targetFormat, names]);


  return (
    <main className="container mx-auto pt-10 pb-10">
      <div className="flex flex-col justify-center items-start md:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold mb-4 text-center md:text-left" data-testid="title">
            Convertidor de imágenes
          </h1>

          <Dropzone
            files={files}
            converted={converted}
            onFilesAdded={handleAddFiles}
            onConvert={handleConvertFile}
            onRemove={handleRemoveFile}
            globalConverting={isConvertingAll}
            names={names}
            onCustomNameChange={handleCustomNameChange}
          />

          <section className="mt-6 hidden md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const key = getKey(file);
              return (
                <ImageCard
                  key={key}
                  file={file}
                  converted={converted.find((c) => `${c.srcFile.name}-${c.srcFile.size}` === key)}
                  onConvert={() => handleConvertFile(file)}
                  onRemove={() => handleRemoveFile(file)}
                  globalConverting={isConvertingAll}
                  customName={names[key] ?? file.name.replace(/\.[^.]+$/, "")}
                  onCustomNameChange={(n) => handleCustomNameChange(file, n)}
                  data-testid={`image-card-${file.name}`}
                />
              );
            })}
          </section>
        </div>

        <aside className="w-full md:w-75 shrink-0 mt-30 sticky top-24 h-fit">
          <div className="p-5 rounded-lg bg-white/5 border border-white/6">
            <Toolbar
              targetFormat={targetFormat}
              onChangeFormat={setTargetFormat}
              onConvertAll={handleConvertAll}
              hasFiles={files.length > 0}
              isConvertingAll={isConvertingAll}
              convertProgress={convertProgress}
              data-testid="toolbar"
            />

            <div className="mt-4">
              <BulkActions
               converted={converted}
                  setConverted={setConverted}
                  data-testid="bulk-actions-sidebar"
                  clearAllFiles={handleClearAllFiles}
                  vertical={true}
                  hasFiles={files.length > 0}
                  onRenameAllParams={applyRenameAll}
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
