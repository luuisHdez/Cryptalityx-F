import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { CONFIG_FIELDS, sameValue } from "./analyticsFormat";
import { fetchBacktestDefaults, startBacktestJob } from "../../API/APIService";

const INTERVALS = ["1m", "5m", "15m", "1h", "1d"];
// Dependen solo del intervalo: se muestran pero no se editan.
const FIXED_KEYS = ["pandas_freq", "minutes", "bars"];
// Opciones de los campos de texto (long y short no comparten confirmación).
const CHOICES = {
  confirm_mode: {
    long: ["none", "close_above_prev_low"],
    short: ["none", "close_below_prev_high"],
  },
  barrier_mode: { long: ["fixed", "vol"], short: ["fixed", "vol"] },
  vol_window: { long: ["1h", "2h", "4h", "6h", "12h", "24h"], short: ["1h", "2h", "4h", "6h", "12h", "24h"] },
};
const HYPERPARAM_HELP = {
  n_estimators: "árboles del modelo",
  max_depth: "profundidad de cada árbol",
  learning_rate: "paso de aprendizaje (0–1]",
  subsample: "fracción de velas por árbol (0–1]",
  colsample_bytree: "fracción de features por árbol (0–1]",
  eval_metric: "métrica interna de XGBoost",
  random_state: "semilla (misma semilla = mismo resultado)",
};

const inputClass =
  "w-full bg-[#1e2026] border border-[#2b3139] text-[#eaecef] text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#3b82f6]";

// Texto del input -> valor con el mismo tipo que el original (número o texto).
const parseValue = (text, original) => {
  if (typeof original !== "number") return text;
  if (text.trim() === "") return NaN;
  return Number(text);
};

const Field = ({ id, label, help, value, original, choices, onChange, changed }) => {
  const invalid = typeof original === "number" && !Number.isFinite(value);
  // Texto tal como se teclea ("-", "0." son pasos válidos al escribir un número).
  const [text, setText] = useState(Number.isFinite(value) || typeof value === "string" ? String(value) : "");
  // Si el valor cambia desde fuera (cargar valores, Restablecer), se refleja.
  useEffect(() => {
    if (!sameValue(parseValue(text, original), value)) {
      setText(Number.isFinite(value) || typeof value === "string" ? String(value) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div
      className={`rounded-md px-3 py-2 border ${
        changed ? "bg-[#2b2a18] border-[#f0b90b]" : "bg-[#161a20] border-[#2b3139]"
      }`}
    >
      <label htmlFor={id} className="block text-[11px] text-[#848e9c] mb-1">{label}</label>
      {choices ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {choices.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          inputMode={typeof original === "number" ? "decimal" : "text"}
          autoComplete="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseValue(e.target.value, original));
          }}
          aria-invalid={invalid}
          className={inputClass}
        />
      )}
      <p className={`mt-1 text-[10px] break-words ${invalid ? "text-[#f6465d]" : "text-[#848e9c]"}`}>
        {invalid ? "valor requerido" : help}
        {changed && !invalid && <span className="text-[#f0b90b]"> · era {String(original)}</span>}
      </p>
    </div>
  );
};

// Formulario de una nueva prueba: modelo + intervalo y dos pestañas (Config e
// Hiperparámetros) que arrancan con los valores de la última corrida del mismo
// modelo e intervalo. Al ejecutar, el backend lanza el script del laboratorio.
const NewRunModal = ({ onClose, onStarted, initialModel = "long", initialInterval = "15m" }) => {
  const [model, setModel] = useState(initialModel);
  const [interval, setInterval] = useState(initialInterval);
  const [tab, setTab] = useState("config");
  const [base, setBase] = useState(null);      // {source, run_id, config, hyperparams}
  const [config, setConfig] = useState({});
  const [hyperparams, setHyperparams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Valores iniciales: siempre del mismo modelo e intervalo.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBacktestDefaults(model, interval)
      .then((data) => {
        if (cancelled) return;
        setBase(data);
        setConfig(data.config);
        setHyperparams(data.hyperparams);
      })
      .catch((err) => !cancelled && setError(err.response?.data?.detail || "No se pudieron cargar los valores"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [model, interval]);

  const configFields = useMemo(
    () => CONFIG_FIELDS.filter(({ key }) => base?.config?.[key] !== undefined && !FIXED_KEYS.includes(key)),
    [base]
  );
  const hyperparamKeys = Object.keys(base?.hyperparams || {});

  const invalid =
    configFields.some(({ key }) => typeof base.config[key] === "number" && !Number.isFinite(config[key])) ||
    hyperparamKeys.some((key) => typeof base.hyperparams[key] === "number" && !Number.isFinite(hyperparams[key]));
  const changes =
    configFields.filter(({ key }) => !sameValue(config[key], base?.config?.[key])).length +
    hyperparamKeys.filter((key) => !sameValue(hyperparams[key], base?.hyperparams?.[key])).length;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (invalid || loading) return;
    setSubmitting(true);
    setError(null);
    try {
      const status = await startBacktestJob({ model, interval, config, hyperparams });
      onStarted?.(status);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo lanzar la corrida");
    } finally {
      setSubmitting(false);
    }
  };

  const tabClass = (name) =>
    `px-3 py-1.5 text-xs rounded-t border-b-2 ${
      tab === name ? "text-[#eaecef] border-[#3b82f6]" : "text-[#848e9c] border-transparent hover:text-[#eaecef]"
    }`;

  return (
    <Modal title="Nueva prueba" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3 text-[#eaecef]">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[10px] text-[#848e9c]">
            Modelo
            <select value={model} onChange={(e) => setModel(e.target.value)} className={inputClass}>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-[#848e9c]">
            Intervalo
            <select value={interval} onChange={(e) => setInterval(e.target.value)} className={inputClass}>
              {INTERVALS.map((iv) => (
                <option key={iv} value={iv}>{iv}</option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-[#848e9c] pb-1.5">
            {loading
              ? "Cargando valores…"
              : base?.source === "run"
                ? `Valores de la corrida #${base.run_id} (${model} ${interval})`
                : base
                  ? `Sin corridas de ${model} ${interval}: valores de config_${model}.py`
                  : ""}
          </p>
        </div>

        <div role="tablist" className="flex gap-1 border-b border-[#2b3139]">
          <button type="button" role="tab" aria-selected={tab === "config"} onClick={() => setTab("config")} className={tabClass("config")}>
            Config
          </button>
          <button type="button" role="tab" aria-selected={tab === "hyper"} onClick={() => setTab("hyper")} className={tabClass("hyper")}>
            Hiperparámetros
          </button>
        </div>

        {!loading && base && tab === "config" && (
          <div role="tabpanel" className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {configFields.map(({ key, label, detail }) => {
              const value = config[key];
              const ok = typeof value === "string" || Number.isFinite(value);
              return (
                <Field
                  key={key}
                  id={`cfg-${key}`}
                  label={label}
                  value={value}
                  original={base.config[key]}
                  choices={CHOICES[key]?.[model]}
                  changed={!sameValue(value, base.config[key])}
                  help={ok ? detail(value, config, model) : ""}
                  onChange={(v) => setConfig((prev) => ({ ...prev, [key]: v }))}
                />
              );
            })}
            <p className="col-span-full text-[10px] text-[#848e9c]">
              pandas_freq, minutes y bars dependen del intervalo y no se editan.
            </p>
          </div>
        )}

        {!loading && base && tab === "hyper" && (
          <div role="tabpanel" className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {hyperparamKeys.map((key) => (
              <Field
                key={key}
                id={`hp-${key}`}
                label={key}
                value={hyperparams[key]}
                original={base.hyperparams[key]}
                changed={!sameValue(hyperparams[key], base.hyperparams[key])}
                help={HYPERPARAM_HELP[key] || ""}
                onChange={(v) => setHyperparams((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>
        )}

        {error && <p className="text-xs text-[#f6465d]" role="alert">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-[#848e9c]">
            {changes ? `${changes} cambio(s) respecto a los valores cargados` : "Sin cambios"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => base && (setConfig(base.config), setHyperparams(base.hyperparams))}
              disabled={!changes || submitting}
              className="px-3 py-1.5 rounded text-xs text-[#b7bdc6] border border-[#2b3139] hover:bg-[#1e2026] disabled:opacity-40"
            >
              Restablecer
            </button>
            <button
              type="submit"
              disabled={loading || invalid || submitting || !base}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-[#3b82f6] hover:bg-[#2f6fd8] disabled:opacity-40"
            >
              {submitting ? "Lanzando…" : "Ejecutar prueba"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewRunModal;
