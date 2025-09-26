
"use client";

type Props = {
  size?: "sm" | "md" | "lg";
  label?: string; // texto visible (opcional) o para lectores de pantalla
  className?: string;
};

export default function Spinner({ size = "md", label, className = "" }: Props) {
  // tamaños en px para ancho/alto y grosor del borde
  const sizes: Record<string, { wh: string; border: string; text: string }> = {
    sm: { wh: "w-4 h-4", border: "border-2", text: "text-xs" },
    md: { wh: "w-6 h-6", border: "border-2", text: "text-sm" },
    lg: { wh: "w-8 h-8", border: "border-4", text: "text-base" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      {/* spinner visual */}
      <div
        className={`${s.wh} ${s.border} rounded-full border-t-transparent border-white/60 border-solid animate-spin`}
        aria-hidden="true"
      />
      {/* etiqueta visible/oculta */}
      {label ? (
        <span className={`${s.text} text-gray-200`}>{label}</span>
      ) : (
        // de no haber label visible, añadir un sr-only para accesibilidad
        <span className="sr-only">Cargando…</span>
      )}
    </div>
  );
}
