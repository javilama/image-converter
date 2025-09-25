// lib/convert.ts
// Lógica de conversión de imágenes en el frontend usando <canvas> y FileReader.
// TypeScript, pensado para ser usado desde componentes React (Next.js).
//
// Exporta:
// - ConvertedImage (tipo)
// - fileToDataUrl(file)
// - sanitizeFilename(name)
// - convertFileTo(file, target, options)
// - revokeObjectUrl(url)  (útil para liberar memoria)

export type ConvertedImage = {
  srcFile: File;     // archivo original (File)
  filename: string;  // nombre serializado listo para descargar (con extensión)
  url: string;       // object URL (blob) para usar en <a href> o <img>
  mime: string;      // mime type del archivo generado
  size?: number;     // tamaño en bytes (opcional)
};

/**
 * fileToDataUrl
 * Convierte un File en dataURL (para previews / carga en Image).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reader.abort();
      reject(new Error('Error leyendo el archivo'));
    };
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * sanitizeFilename
 * Normaliza el nombre: elimina la extensión inicial, quita acentos/diacríticos,
 * elimina caracteres no alfanuméricos (salvo guiones y guiones bajos) y reemplaza
 * espacios por guiones (-). Devuelve en minúsculas.
 */
export function sanitizeFilename(name: string) {
  // quitar la extensión
  const withoutExt = name.replace(/\.[^.]+$/, '');
  // normalizar acentos
  const normalized = withoutExt.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  // mantener letras, numeros, guiones, underscores y espacios; luego convertir espacios a guiones
  const cleaned = normalized.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  return cleaned.toLowerCase();
}

/**
 * loadImage
 * Carga una imagen a partir de un dataURL y devuelve un HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Evita problemas de CORS si viniera de un recurso externo; pero aquí trabajamos con dataURLs
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen: ' + String(e)));
    img.src = src;
  });
}

/**
 * dataUrlToBlob
 * Helper: convierte un dataURL en un Blob.
 * Sirve como fallback si canvas.toBlob devuelve null en ciertos navegadores/formatos.
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * convertFileTo
 * Convierte un File (PNG/JPEG/WEBP) a target ('webp'|'png'|'jpg') usando canvas.
 * Opciones:
 *  - quality: número 0..1 (aplica a webp/jpg)
 *
 * NOTAS:
 *  - Mantiene las dimensiones originales para preservar calidad.
 *  - Usa canvas.toBlob para obtener un Blob eficiente.
 *  - Si toBlob falla, se hace fallback a toDataURL -> Blob.
 *  - Devuelve un objeto ConvertedImage con object URL listo para descargar/mostrar.
 */
export async function convertFileTo(
  file: File,
  target: 'webp' | 'png' | 'jpg',
  options?: { quality?: number }
): Promise<ConvertedImage> {
  // Validar tipo básico (acepta ahora png, jpeg/jpg y webp)
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
    throw new Error('Tipo de archivo no soportado. Solo PNG/JPEG/WEBP admitidos.');
  }

  // 1) leer a dataURL
  const dataUrl = await fileToDataUrl(file);

  // 2) crear elemento Image para dibujar en canvas
  const img = await loadImage(dataUrl);

  // 3) crear canvas con dimensiones originales
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto 2D del canvas');

  // dibujar la imagen completa
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 4) elegir mime y quality
  let mime = 'image/webp';
  if (target === 'png') mime = 'image/png';
  if (target === 'jpg') mime = 'image/jpeg';
  const quality = typeof options?.quality === 'number'
    ? Math.max(0, Math.min(1, options.quality))
    : 0.9;

  // 5) obtener blob desde canvas
  let blob: Blob | null = await new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), mime, quality);
    } catch {
      resolve(null);
    }
  });

  // fallback a toDataURL si toBlob devuelve null
  if (!blob) {
    const fallbackDataUrl = canvas.toDataURL(mime, quality);
    blob = await dataUrlToBlob(fallbackDataUrl);
  }

  if (!blob) throw new Error('No se pudo generar el blob del canvas');

  // 6) crear object URL para descargar/mostrar
  const url = URL.createObjectURL(blob);

  // 7) preparar nombre de salida saneado
  const ext = target === 'png' ? 'png' : target === 'jpg' ? 'jpg' : 'webp';
  const filename = `${sanitizeFilename(file.name)}.${ext}`;

  return {
    srcFile: file,
    filename,
    url,
    mime,
    size: blob.size,
  };
}

/**
 * revokeObjectUrl
 * Helper para liberar object URLs cuando ya no son necesarias.
 */
export function revokeObjectUrl(url: string | undefined | null) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignorar si falla
  }
}
