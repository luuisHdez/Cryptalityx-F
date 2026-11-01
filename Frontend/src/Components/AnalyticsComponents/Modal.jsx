import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Ventana modal simple: se cierra con Escape, con el botón o al hacer clic fuera.
const Modal = ({ title, onClose, children, wide = false }) => {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Se registra una sola vez: el foco va al botón de cerrar al abrir, no en cada render.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#0b0e11] border border-[#2b3139] rounded-lg w-full ${wide ? "max-w-[1400px]" : "max-w-[900px]"} max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b3139] bg-[#131722] rounded-t-lg">
          <h2 className="text-sm font-semibold text-[#eaecef]">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 rounded text-[#b7bdc6] hover:bg-[#1e2026]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-auto no-scrollbar p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
