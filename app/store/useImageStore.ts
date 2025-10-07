// app/store/useImageStore.ts
import { create } from 'zustand';
import { ConvertedImage } from '../lib/convert';

// --- Utilidades (movidas desde Home) ---
// mover estas funciones fuera del store para mantenerlo limpio.
export const getKey = (file: File) => `${file.name}-${file.size}`;

export function sanitizeFilenameForDownload(name: string, originalName: string): string {
  const baseName = name && name.trim() !== "" ? name : originalName;
  const withoutExt = baseName.replace(/\.[^.]+$/, "");
  const normalized = withoutExt.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = normalized.replace(/[^\w\s-]/g, "").trim();
  const slug = cleaned.replace(/\s+/g, "-").toLowerCase();
  return slug || originalName.replace(/\.[^.]+$/, "");
}

// --- Definición de Tipos para el Store ---
interface ImageState {
  files: File[];
  converted: ConvertedImage[];
  targetFormat: "webp" | "png" | "jpg";
  isConvertingAll: boolean;
  convertProgress: { current: number; total: number };
  names: Record<string, string>;
  // nuevo: mensaje de error de conversión
  conversionError: string | null;
  // nuevo: clave del archivo que causó la alerta/error (para resaltar ImageCard)
  alertFileKey: string | null;
}

interface ImageActions {
  // Acciones de archivos
  addFiles: (newFiles: File[]) => void;
  removeFile: (file: File) => void;
  clearAllFiles: () => void;
  
  // Acciones de conversión
  setTargetFormat: (format: "webp" | "png" | "jpg") => void;
  convertFile: (file: File) => Promise<void>;
  convertAll: () => Promise<void>;

  // Acciones de errores
  setConversionError: (msg: string | null) => void;
  // nueva acción para setear/limpiar la clave del archivo que provocó la alerta
  setAlertFileKey: (key: string | null) => void;
  
  // Acciones de renombrado
  setCustomName: (file: File, name: string) => void;
  renameAll: (params: { prefix: string; name: string; keyType: "index" | "original" | "counter"; }) => void;

  // utilidad para actualizar converted desde UI si hace falta
  setConverted: (updater: ((prev: ConvertedImage[]) => ConvertedImage[]) | ConvertedImage[]) => void;
  
}

type ImageStore = ImageState & ImageActions;

// --- Creación del Store ---
export const useImageStore = create<ImageStore>((set, get) => ({
  // --- Estado Inicial ---
  files: [],
  converted: [],
  targetFormat: "webp",
  isConvertingAll: false,
  convertProgress: { current: 0, total: 0 },
  names: {},
  conversionError: null,
  alertFileKey: null,

  // --- Acciones (lógica de negocio) ---
  addFiles: (newFiles) => {
    set((state) => {
      const existing = new Map(state.files.map((f) => [getKey(f), f]));
      newFiles.forEach((f) => existing.set(getKey(f), f));
      const mergedFiles = Array.from(existing.values());

      const mergedKeys = new Set(mergedFiles.map((f) => getKey(f)));
      const nextNames = { ...state.names };
      Object.keys(nextNames).forEach((k) => {
        if (!mergedKeys.has(k)) delete nextNames[k];
      });
      mergedFiles.forEach((f) => {
        const k = getKey(f);
        if (!(k in nextNames)) nextNames[k] = f.name.replace(/\.[^.]+$/, "");
      });

      return { files: mergedFiles, names: nextNames };
    });
  },

  removeFile: (file) => {
    const key = getKey(file);
    set((state) => ({
      files: state.files.filter((f) => getKey(f) !== key),
      converted: state.converted.filter((c) => getKey(c.srcFile) !== key),
      names: (() => {
        const n = { ...state.names };
        delete n[key];
        return n;
      })(),
    }));
  },

  clearAllFiles: () => {
    const { converted } = get();
    converted.forEach((c) => {
      try { URL.revokeObjectURL(c.url); } catch {}
    });
    set({ files: [], converted: [], names: {}, conversionError: null, alertFileKey: null });
  },

  setTargetFormat: (format) => set({ targetFormat: format }),

  // nueva acción para actualizar converted desde UI o componentes
  setConverted: (updater) =>
    set((state) => {
      if (typeof updater === "function") {
        
        return { converted: (updater as (prev: ConvertedImage[]) => ConvertedImage[])(state.converted) };
      }
      return { converted: updater as ConvertedImage[] };
    }),

  convertFile: async (file) => {
    const { convertFileTo } = await import("../lib/convert");
    try {
      const { targetFormat, names } = get();
      const result: ConvertedImage = await convertFileTo(file, targetFormat, { quality: 0.9 });

      const key = getKey(file);
      const controlledBase = names[key] ?? file.name.replace(/\.[^.]+$/, "");
      const ext = result.filename?.split(".").pop() || targetFormat || file.name.split(".").pop() || "png";
      const safeBase = sanitizeFilenameForDownload(controlledBase, file.name);
      const newFilename = `${safeBase}.${ext}`;
      const adjusted: ConvertedImage = { ...result, filename: newFilename };

      set((state) => {
        const filtered = state.converted.filter((c) => getKey(c.srcFile) !== key);
        return { converted: [...filtered, adjusted], conversionError: null, alertFileKey: null };
      });
    } catch (err: unknown) {
      // capturamos el error y lo guardamos en el store en lugar de relanzar
       const message = err instanceof Error ? err.message : String(err);
      console.error("Error en convertFile:", message);
      set({ conversionError: message, alertFileKey: getKey(file) });
    }
  },

  convertAll: async () => {
    const { files, targetFormat, names } = get();
    if (!files.length) return;
    
    set({ isConvertingAll: true, convertProgress: { current: 0, total: files.length }, conversionError: null, alertFileKey: null });

    try {
      const { convertFileTo } = await import("../lib/convert");
      const results: ConvertedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        let r: ConvertedImage;
        try {
          r = await convertFileTo(f, targetFormat, { quality: 0.9 });
        } catch (err: unknown) {
          // guardar error en el store y limpiar estado parcial
           const message = err instanceof Error ? err.message : String(err);
          console.error("Error en Convertir todo:", message);
          set({ conversionError: message, isConvertingAll: false, convertProgress: { current: 0, total: 0 }, alertFileKey: getKey(f) });

          // revocar urls parciales si existen
          results.forEach((c) => {
            try { URL.revokeObjectURL(c.url); } catch {}
          });
          return; // salimos sin lanzar error
        }

        const key = getKey(f);
        const controlledBase = names[key] ?? f.name.replace(/\.[^.]+$/, "");
        const ext = r.filename?.split(".").pop() || targetFormat || f.name.split(".").pop() || "png";
        const safeBase = sanitizeFilenameForDownload(controlledBase, f.name);
        const newFilename = `${safeBase}.${ext}`;
        const adjusted: ConvertedImage = { ...r, filename: newFilename };

        results.push(adjusted);
        set({ convertProgress: { current: i + 1, total: files.length } });
      }

      set((state) => {
        const filtered = state.converted.filter(
          (c) => !results.some((res) => getKey(res.srcFile) === getKey(c.srcFile))
        );
        return { converted: [...filtered, ...results] };
      });
    } catch (err: unknown) {
    console.error("Error en Convertir todo (unexpected):", err);
    
    // 1. Verificar si el error es un objeto de tipo Error nativo (o similar)
    if (err instanceof Error) {
        // Acceso seguro a la propiedad 'message'
        set({ conversionError: err.message });
    } else {
        // 2. Si es diferente (string, número, etc.), convertirlo a string.
        set({ conversionError: String(err) });
    }
} 
    finally {
      set({ isConvertingAll: false });
      setTimeout(() => set({ convertProgress: { current: 0, total: 0 } }), 400);
    }
  },

  setCustomName: (file, name) => {
    const key = getKey(file);
    set((state) => ({ names: { ...state.names, [key]: name } }));
  },

  renameAll: ({ prefix, name, keyType }) => {
    const { files, names, targetFormat } = get();
    const timestamp = Date.now();

    // Actualizar nombres en el estado
    const nextNames: Record<string, string> = {};
    files.forEach((f, idx) => {
      const origBase = f.name.replace(/\.[^.]+$/, "");
      let keySuffix: string;
      if (keyType === "counter") keySuffix = `${timestamp + idx}`;
      else if (keyType === "original") keySuffix = origBase;
      else keySuffix = `${idx + 1}`;
      
      const parts: string[] = [prefix.trim(), name.trim(), keySuffix.trim()].filter(Boolean);
      const combined = parts.join("-");
      const safe = sanitizeFilenameForDownload(combined, origBase);
      nextNames[getKey(f)] = safe;
    });

    // Actualizar nombres de los archivos convertidos
    const nextConverted = get().converted.map((c, i) => {
      const k = getKey(c.srcFile);
      const base = nextNames[k] ?? c.srcFile.name.replace(/\.[^.]+$/, "");
      const ext = c.filename.split(".").pop() || targetFormat || "png";
      return { ...c, filename: `${base}.${ext}` };
    });

    set({ names: nextNames, converted: nextConverted });
  },

  // nueva acción para guardar/limpiar mensaje de error
  setConversionError: (msg) => set({ conversionError: msg }),
  // nueva acción para setear/limpiar la clave del archivo que causó el alerta
  setAlertFileKey: (key) => set({ alertFileKey: key }),
}));
// --- FIN DEL STORE ---