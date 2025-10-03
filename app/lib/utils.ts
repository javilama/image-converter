// app/lib/utils.ts
export function fingerprintOf(file: File) {
  return `${file.name}|${file.size}`;
}

/**
 * sanitizeFilename
 * - name: valor preferido (puede estar vacío)
 * - originalName: fallback (ej: nombre del archivo original)
 *
 * Devuelve un slug limpio **sin extensión** en minúsculas.
 */
export function sanitizeFilename(name: string, originalName?: string): string {
  const sourceRaw =
    name && String(name).trim().length > 0 ? String(name) : (originalName ?? "");
  const withoutExt = sourceRaw.replace(/\.[^.]+$/, "");
  const normalized = withoutExt.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = normalized.replace(/[^\w\s-]/g, "").trim();
  const slug = cleaned.replace(/\s+/g, "-").toLowerCase();
  if (!slug && originalName) {
    return originalName.replace(/\.[^.]+$/, "").toLowerCase();
  }
  return slug;
}
