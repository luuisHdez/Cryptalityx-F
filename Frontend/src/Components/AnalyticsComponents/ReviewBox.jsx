import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateBacktestReview } from "../../API/APIService";
import { REVIEW_STATUSES, formatIsoDisplay } from "./analyticsFormat";

// Revisión manual de la corrida: estado + notas.
const ReviewBox = ({ run, onSaved }) => {
  const [status, setStatus] = useState(run.review_status || "pending");
  const [notes, setNotes] = useState(run.review_notes || "");
  const [saving, setSaving] = useState(false);

  // Al cambiar de corrida se cargan sus valores.
  useEffect(() => {
    setStatus(run.review_status || "pending");
    setNotes(run.review_notes || "");
  }, [run.id, run.review_status, run.review_notes]);

  const dirty = status !== (run.review_status || "pending") || notes !== (run.review_notes || "");

  const save = async () => {
    setSaving(true);
    try {
      const saved = await updateBacktestReview(run.id, status, notes.trim());
      onSaved(saved);
      toast.success(`Revisión de #${run.id} guardada`, { theme: "dark" });
    } catch (err) {
      toast.error(err.message, { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="review-title" className="bg-[#161a20] border border-[#2b3139] rounded-md p-3 flex flex-col gap-3">
      <h3 id="review-title" className="text-[11px] tracking-wider text-[#848e9c] uppercase">Tu revisión</h3>

      <div role="group" aria-label="Estado de la revisión" className="grid grid-cols-2 gap-2">
        {Object.entries(REVIEW_STATUSES).map(([key, s]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            aria-pressed={status === key}
            className={`text-xs rounded px-2 py-1.5 border transition-opacity ${s.classes} ${
              status === key ? "opacity-100 ring-1 ring-current" : "opacity-50 hover:opacity-80"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-[11px] text-[#848e9c]">
        Notas
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={10000}
          placeholder="Qué viste en la gráfica, qué cambiarías en la próxima prueba…"
          className="bg-[#0b0e11] border border-[#2b3139] rounded p-2 text-xs text-[#eaecef] resize-y focus:outline-none focus:border-[#3b82f6]"
        />
      </label>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#5e6673]">
          {run.reviewed_at ? `Revisada ${formatIsoDisplay(run.reviewed_at)}` : "Sin revisar"}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="text-xs rounded px-4 py-1.5 bg-[#3b82f6] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2f6fdc]"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </section>
  );
};

export default ReviewBox;
