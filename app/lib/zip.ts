// lib/zip.ts
// Empaqueta un array de ConvertedImage en un ZIP usando JSZip (en el frontend).
// Requiere instalar `jszip` (y `@types/jszip` para soporte TS (Opcional)):
// npm i jszip
// npm i -D @types/jszip
//
// Exporta:
// - zipFiles(converted): Promise<Blob>
//
import JSZip from 'jszip';
import type { ConvertedImage } from './convert';

/**
 * zipFiles
 * Dado un array de ConvertedImage (que contienen object URLs en `url`),
 * crea un ZIP y lo devuelve como Blob listo para descargar.
 *
 * Usa compresión DEFLATE a nivel intermedio.
 */
export async function zipFiles(converted: ConvertedImage[], opts?: { compressionLevel?: number }): Promise<Blob> {
  const zip = new JSZip();
  const level = typeof opts?.compressionLevel === 'number' ? Math.max(0, Math.min(9, opts!.compressionLevel)) : 6;

  // Para cada imagen, fetch la blob desde su object URL y añadir al zip
  for (const item of converted) {
    try {
      // fetch a object URL local funciona bien en el navegador
      const resp = await fetch(item.url);
      if (!resp.ok) {
        // si falla fetch, intenta omitir el archivo en lugar de abortar todo el proceso
        console.warn(`No se pudo obtener blob para ${item.filename}: ${resp.status}`);
        continue;
      }
      const blob = await resp.blob();
      // Añadir archivo al zip, respetando su nombre sanitized
      zip.file(item.filename, blob);
    } catch (err) {
      // No interrumpimos todo; registramos y seguimos
      console.warn('Error al añadir archivo al zip:', item.filename, err);
    }
  }

  // Generar el blob del ZIP (DEFLATE)
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level },
  });

  return zipBlob;
}
