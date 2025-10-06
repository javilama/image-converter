// app/store/useImageStore.ts
import { create } from 'zustand';
import { ConvertedImage } from '../lib/convert';

// --- Utilidades (movidas desde Home) ---
// **mover estas funciones fuera del store para mantenerlo limpio.
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
  
  // Acciones de renombrado
  setCustomName: (file: File, name: string) => void;
  renameAll: (params: { prefix: string; name: string; keyType: "index" | "original" | "counter"; }) => void;

  // accion de limpiar conversiones en bulkAction
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
    set({ files: [], converted: [], names: {} });
  },

  setTargetFormat: (format) => set({ targetFormat: format }),

  convertFile: async (file) => {
    const { convertFileTo } = await import("../lib/convert");
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
      return { converted: [...filtered, adjusted] };
    });
  },

  convertAll: async () => {
    const { files, targetFormat, names } = get();
    if (!files.length) return;
    
    set({ isConvertingAll: true, convertProgress: { current: 0, total: files.length } });

    try {
      const { convertFileTo } = await import("../lib/convert");
      const results: ConvertedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const r: ConvertedImage = await convertFileTo(f, targetFormat, { quality: 0.9 });

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
    } catch (err) {
      console.error("Error en Convertir todo:", err);
    } finally {
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
  // acción para ajustar el array 'converted' desde componentes
  setConverted: (updater) =>
    set((state) => {
      if (typeof updater === "function") {
        // @ts-ignore -- tipar correctamente si haces overload
        return { converted: (updater as (prev: ConvertedImage[]) => ConvertedImage[])(state.converted) };
      }
      return { converted: updater as ConvertedImage[] };
    }),


}));