// app/components/CustomFormatSelect.tsx
"use client";
import { useState, useEffect, useRef } from "react";

type Option = { value: "webp" | "png" | "jpg"; label: string };

type Props = {
  targetFormat: "webp" | "png" | "jpg";
  onChangeFormat: (val: "webp" | "png" | "jpg") => void;
  isConvertingAll?: boolean;
  className?: string;
  // Aceptamos el atributo con guión tal como lo pasas desde JSX
  "data-testid"?: string;
};

/**
 * CustomFormatSelect
 *
 * Select reemplazo hecho con div/ul para permitir estilizado avanzado.
 * Mantiene la API: targetFormat, onChangeFormat, isConvertingAll.
 *
 * Notas:
 * - Soporta className para controlar ancho/estilos desde el padre (Toolbar).
 * - Acepta 'data-testid' para mantener tests existentes.
 * - No implementa control completo por teclado (flechas), pero sí roles y aria.
 */
export default function CustomSelect(props: Props) {
  const {
    targetFormat,
    onChangeFormat,
    isConvertingAll = false,
    className = "w-48 rounded-lg",
  } = props;

  // extraer data-testid (prop con guión)
  const dataTestId = props["data-testid"];

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const options: Option[] = [
    { value: "webp", label: "WEBP (recomendado)" },
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPG" },
  ];

  const handleSelect = (val: "webp" | "png" | "jpg") => {
    onChangeFormat(val);
    setOpen(false);
  };

  // click fuera -> cerrar
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative text-xs md:text-base ${className}`}
      data-testid={dataTestId}
    >
      <button
        type="button"
        onClick={() => !isConvertingAll && setOpen((s) => !s)}
        disabled={isConvertingAll}
        className={`w-full flex justify-between items-center bg-white/10 rounded px-3 py-2 
          ${isConvertingAll ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar formato de salida"
      >
        <span>
          {options.find((opt) => opt.value === targetFormat)?.label || "Seleccionar"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-activedescendant={targetFormat}
          className="absolute z-10 mt-1 w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg overflow-hidden"
        >
          {options.map((opt) => (
            <li
              role="option"
              id={`option-${opt.value}`}
              key={opt.value}
              aria-selected={targetFormat === opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`px-3 py-2 hover:bg-white/20 cursor-pointer ${
                targetFormat === opt.value ? "bg-white/20 font-semibold" : ""
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
