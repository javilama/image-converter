// helpers/renameHelpers.ts

import type { ConvertedImage } from "@/app/lib/convert";

/**
 * 🔹 Genera una key estable para un archivo (para identificarlo en un Record)
 */
export const getKey = (file: File): string => `${file.name}-${file.size}`;

/**
 * 🔹 Normaliza y limpia nombres para descarga
 */
export function sanitizeFilenameForDownload(
  name: string,
  originalName: string
): string {
  const baseName = name && name.trim() !== "" ? name : originalName;
  const withoutExt = baseName.replace(/\.[^.]+$/, "");
  const normalized = withoutExt.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = normalized.replace(/[^\w\s-]/g, "").trim();
  const slug = cleaned.replace(/\s+/g, "-").toLowerCase();
  return slug || originalName.replace(/\.[^.]+$/, "");
}

/**
 * 🔹 Genera un hash corto y único para un archivo usando sus metadatos
 */
export async function computeHashForFileMeta(file: File): Promise<string> {
  const data = `${file.name}-${file.size}-${file.lastModified}`;
  const enc = new TextEncoder();
  const buf = enc.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 8); // 8 caracteres para ser corto y legible
}

/**
 * 🔹 Aplica renombrado masivo a un array de conversiones
 * 
 * @param converted Array de imágenes convertidas
 * @param params Parámetros de renombrado
 *  - prefix: prefijo a usar
 *  - name: base de nombre a usar
 *  - type: 'hash' | 'counter' | 'timestamp'
 */
export async function applyRenameAll(
  converted: ConvertedImage[],
  params: { prefix?: string; name?: string; type: "hash" | "counter" | "timestamp" }
): Promise<ConvertedImage[]> {
  const { prefix = "", name = "image", type = "counter" } = params;

  const renamed: ConvertedImage[] = [];

  for (let i = 0; i < converted.length; i++) {
    const c = converted[i];

    let uniquePart = "";
    if (type === "counter") {
      uniquePart = String(i + 1).padStart(3, "0"); // contador 001, 002...
    } else if (type === "timestamp") {
      uniquePart = String(Date.now()); // timestamp en ms
    } else if (type === "hash") {
      uniquePart = await computeHashForFileMeta(c.srcFile); // hash 8 caracteres
    }

    // base de nombre
    const baseName = `${prefix}${name}${uniquePart ? "-" + uniquePart : ""}`;

    // extensión
    const ext = c.filename?.split(".").pop() || "png";

    // nombre final
    const safeName = sanitizeFilenameForDownload(baseName, c.srcFile.name);
    const finalName = `${safeName}.${ext}`;

    renamed.push({
      ...c,
      filename: finalName,
    });
  }

  return renamed;
}
