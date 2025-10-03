// app/hooks/useConversionManager.ts
"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { ConvertedImage } from "../lib/convert";
import { fingerprintOf, sanitizeFilename } from "../lib/utils";


type ConvertOptions = {
  quality?: number;
  filenameBase?: string;      // <- añadimos filenameBase
  signal?: AbortSignal;       // <- soporta abort
};

type ConvertFn = (
  file: File,
  targetFormat: "webp" | "png" | "jpg",
  opts?: ConvertOptions
) => Promise<ConvertedImage>;

type FileItemMinimal = { id: string; file: File; customName?: string };

export default function useConversionManager(
   items: { id: string; file: File; customName?: string }[],
  options?: { concurrency?: number; defaultQuality?: number; convertFn?: ConvertFn }

) {
  const concurrency = options?.concurrency ?? 1;
  const defaultQuality = options?.defaultQuality ?? 0.9;
  const externalConvertFn = options?.convertFn;

  const [converted, setConverted] = useState<ConvertedImage[]>([]);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [convertProgress, setConvertProgress] = useState({ current: 0, total: 0 });

  // Abort controller para cancelar conversiones en curso
  const abortControllerRef = useRef<AbortController | null>(null);

  // default convert function (dynamic import para mantener bundle pequeño)
const defaultConvert: ConvertFn = useCallback(
  async (file, targetFormat, opts) => {
    const mod = await import("../lib/convert");
    // Forwardear calidad y filenameBase (y cualquier otra opción que quieras soportar)
    const quality = typeof opts?.quality === "number" ? opts.quality : defaultQuality;
    const filenameBase = opts?.filenameBase;
    // Llamamos convertFileTo pasando filenameBase y quality
    return mod.convertFileTo(file, targetFormat, { quality, filenameBase });
  },
  [defaultQuality]
);


  const getConvertFn = useCallback(() => externalConvertFn ?? defaultConvert, [externalConvertFn, defaultConvert]);

  

  // ---- Helpers internos ----

  
  const dedupeAndPush = useCallback((r: ConvertedImage) => {
    setConverted((prev) => {
      const filtered = prev.filter(
        (c) => c.srcFile.name + c.srcFile.size !== r.srcFile.name + r.srcFile.size
      );
      return [...filtered, r];
    });
  }, []);

  // revoca object URLs y limpia converted
  const clearConverted = useCallback(() => {
    setConverted((prev) => {
      prev.forEach((c) => {
        try {
          URL.revokeObjectURL(c.url);
        } catch {}
      });
      return [];
    });
  }, []);

  // remover un converted asociado a un File y revocar su URL
  const removeConvertedByFile = useCallback((file: File) => {
    const key = file.name + file.size;
    setConverted((prev) => {
      const filtered = prev.filter((c) => {
        const keep = c.srcFile.name + c.srcFile.size !== key;
        if (!keep) {
          try {
            URL.revokeObjectURL(c.url);
          } catch {}
        }
        return keep;
      });
      return filtered;
    });
  }, []);

  // cancelar todas las conversiones en curso
  const cancelAll = useCallback(() => {
    try {
      abortControllerRef.current?.abort();
    } catch {}
    abortControllerRef.current = null;
    setIsConvertingAll(false);
  }, []);

  // ---- convertir un único archivo ----
 const convertOne = useCallback(
  async (
    file: File,
    params?: { targetFormat?: "webp" | "png" | "jpg"; customName?: string; quality?: number }
  ): Promise<ConvertedImage | undefined> => {
    const target = params?.targetFormat ?? ("webp" as const);

    // asegurar abort controller
    if (!abortControllerRef.current) abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const fn = getConvertFn();

      // ---- 1) Obtener rawBase (prioridad: params.customName -> items[...] -> file.name)
      const id = `${file.name}|${file.size}`;
      const found = items.find((it) => it.id === id);
      const rawBase =
        params?.customName && String(params.customName).trim() !== ""
          ? String(params.customName)
          : found?.customName && String(found.customName).trim() !== ""
          ? String(found.customName)
          : file.name.replace(/\.[^.]+$/, "");

      // ---- 2) Sanitizar y quitar cualquier extensión remanente
      const filenameBaseSanitized = sanitizeFilename(rawBase, file.name).replace(/\.[^.]+$/, "");

      // (opcional debug) console.log("convertOne -> filenameBaseSanitized:", filenameBaseSanitized);

      // ---- 3) llamar al convertFn pasando filenameBase (si soporta la opción)
      const r = await fn(file, target, {
        quality: params?.quality ?? defaultQuality,
        filenameBase: filenameBaseSanitized,
        signal,
      } as any);

      // ---- 4) Safety overwrite (asegurar extensión coherente)
      const ext = target === "png" ? "png" : target === "jpg" ? "jpg" : "webp";
      r.filename = `${filenameBaseSanitized}.${ext}`;

      // (opcional debug) console.log("convertOne -> final r.filename:", r.filename);

      // ---- 5) Push al estado (dedupe)
      dedupeAndPush(r);

      return r;
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        return undefined;
      }
      console.error("convertOne error:", err);
      throw err;
    }
  },
  // IMPORTANTE: ahora incluimos items en las dependencias para evitar stale closures
  [getConvertFn, defaultQuality, dedupeAndPush, items]
);



  // ---- util para correr tareas con concurrency control ----
  async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrencyLimit: number) {
    const results: (T | undefined)[] = new Array(tasks.length);
    let currentIndex = 0;

    async function worker() {
      while (true) {
        const idx = currentIndex++;
        if (idx >= tasks.length) return;
        try {
          results[idx] = await tasks[idx]();
        } catch (e) {
          results[idx] = undefined;
        }
      }
    }

    const workers = new Array(Math.min(concurrencyLimit, tasks.length)).fill(null).map(() => worker());
    await Promise.all(workers);
    return results;
  }

  // ---- convertir todo (items debe contener customName si quieres aplicarlo) ----
  const convertAll = useCallback(
    async (items: FileItemMinimal[], targetFormat: "webp" | "png" | "jpg") => {
      if (!items || !items.length) return;
      // cancelar si ya había otro proceso
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsConvertingAll(true);
      setConvertProgress({ current: 0, total: items.length });

      // contador local para progreso incremental (podría usarse un ref)
      let done = 0;

      const tasks = items.map((it) => async () => {
        if (signal.aborted) throw new DOMException("aborted", "AbortError");

        // usar convertOne internamente pero con llamada directa a convertFn para evitar re-creating controller
        const fn = getConvertFn();
        const r = await fn(it.file, targetFormat, { quality: defaultQuality, signal });

        // aplicar nombre custom si existe
        const base = it.customName ?? it.file.name.replace(/\.[^.]+$/, "");
        const ext = targetFormat || r.filename?.split(".").pop() || "png";
        r.filename = `${sanitizeFilename(base, it.file.name)}.${ext}`;

        dedupeAndPush(r);

        done += 1;
        setConvertProgress({ current: done, total: items.length });
        return r;
      });

      try {
        await runWithConcurrency(tasks, concurrency);
      } catch (err) {
        if ((err as any)?.name === "AbortError") {
          // cancelado por el usuario; no mostrar stack
        } else {
          console.error("convertAll error:", err);
          throw err;
        }
      } finally {
        setIsConvertingAll(false);
        // dejar el progreso visible brevemente o limpiarlo
        setTimeout(() => setConvertProgress({ current: 0, total: 0 }), 400);
      }
    },
    [concurrency, defaultQuality, getConvertFn, dedupeAndPush]
  );

  // limpieza automática al desmontar (revoke + cancelar)
  useEffect(() => {
    return () => {
      try {
        abortControllerRef.current?.abort();
      } catch {}
      // no revocar URLs aquí — el caller debe decidir cuándo limpiar converted
    };
  }, []);

  return {
    converted,
    setConverted,
    isConvertingAll,
    convertProgress,
    convertOne,
    convertAll,
    cancelAll,
    clearConverted,
    removeConvertedByFile,
  };
}
