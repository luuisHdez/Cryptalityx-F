import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../AnalyticsComponents/Modal";
import { deleteTelegramLink, fetchTelegramLink, saveTelegramLink } from "../../API/APIService";

const ID_PATTERN = /^\d{5,15}$/;

// Formulario para vincular la cuenta de Telegram con el usuario del dashboard.
// El bot solo responde a cuentas vinculadas.
const TelegramLinkModal = ({ onClose }) => {
  const [current, setCurrent] = useState(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTelegramLink()
      .then((data) => {
        setCurrent(data.telegram_id);
        setValue(data.telegram_id || "");
      })
      .catch(() => toast.error("❌ No se pudo leer la vinculación", { theme: "dark" }))
      .finally(() => setLoading(false));
  }, []);

  const valid = ID_PATTERN.test(value.trim());

  const onSave = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const data = await saveTelegramLink(value.trim());
      setCurrent(data.telegram_id);
      toast.success("✅ Telegram vinculado", { theme: "dark" });
    } catch (err) {
      toast.error(`❌ ${err.response?.data?.detail || "No se pudo vincular"}`, { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const onUnlink = async () => {
    setSaving(true);
    try {
      await deleteTelegramLink();
      setCurrent(null);
      setValue("");
      toast.info("Vinculación eliminada", { theme: "dark" });
    } catch {
      toast.error("❌ No se pudo desvincular", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Vincular Telegram" onClose={onClose}>
      <form onSubmit={onSave} className="space-y-3 max-w-sm text-xs text-[#eaecef]">
        <p className="text-[#848e9c]">
          Escríbele al bot y copia el número que aparece en la consola del backend:{" "}
          <span className="font-mono">DEBUG: Mensaje de &lt;id&gt;</span>.
        </p>
        <p>
          Estado:{" "}
          {loading ? (
            <span className="text-[#848e9c]">cargando…</span>
          ) : current ? (
            <span className="text-[#0ecb81]">vinculado ({current})</span>
          ) : (
            <span className="text-[#f6465d]">sin vincular</span>
          )}
        </p>
        <div>
          <label htmlFor="telegram-id" className="block mb-1">ID de Telegram</label>
          <input
            id="telegram-id"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            disabled={loading || saving}
            aria-invalid={value !== "" && !valid}
            aria-describedby="telegram-id-help"
            className="w-full p-1.5 rounded bg-gray-900 text-white border border-blue-800"
          />
          <p id="telegram-id-help" className="mt-1 text-[10px] text-[#848e9c]">Solo números (5 a 15 dígitos).</p>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!valid || loading || saving || value.trim() === current}
            className="px-3 py-1 rounded text-[11px] text-sky-200 border border-sky-800/50 bg-sky-950/40 hover:bg-sky-900/50 disabled:opacity-40"
          >
            Guardar
          </button>
          {current && (
            <button
              type="button"
              onClick={onUnlink}
              disabled={saving}
              className="px-3 py-1 rounded text-[11px] text-red-300 border border-red-800/50 bg-red-950/30 hover:bg-red-900/50 disabled:opacity-40"
            >
              Desvincular
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default TelegramLinkModal;
