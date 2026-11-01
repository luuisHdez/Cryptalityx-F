import { RefreshCw } from "lucide-react";
import { REVIEW_STATUSES, RUN_STATUSES, configSummary, formatIsoDisplay } from "./analyticsFormat";

const MODEL_LABEL = { short: "Short", long: "Long" };
const INTERVALS = ["1m", "5m", "15m", "1h", "1d"];

const selectClass =
  "bg-[#1e2026] border border-[#2b3139] text-[#b7bdc6] text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#3b82f6]";

const RunCard = ({ run, selected, onSelect }) => {
  const m = run.metrics || {};
  const [line1, line2] = configSummary(run.config);
  const review = REVIEW_STATUSES[run.review_status] || REVIEW_STATUSES.pending;
  const runStatus = RUN_STATUSES[run.status];

  return (
    <button
      type="button"
      onClick={() => onSelect(run.id)}
      aria-current={selected ? "true" : undefined}
      className={`w-full text-left rounded-md border p-3 transition-colors ${
        selected ? "bg-[#1e2a3a] border-[#3b82f6]" : "bg-[#161a20] border-[#2b3139] hover:border-[#4a5260]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#eaecef]">
          #{run.id} · {MODEL_LABEL[run.model] || run.model} {run.interval}
        </span>
        <span className="text-[11px] text-[#848e9c]">{formatIsoDisplay(run.created_at)}</span>
      </div>

      {run.status === "done" ? (
        <p className="mt-1 text-xs text-[#b7bdc6]">
          {m.signals} señales · <span className="text-[#0ecb81]">{m.tp} TP</span> ·{" "}
          <span className="text-[#f6465d]">{m.sl} SL</span> ·{" "}
          <span className="text-[#848e9c]">{m.timeout} timeout</span>
        </p>
      ) : (
        <p className="mt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${runStatus?.classes || ""}`}>
            {runStatus?.label || run.status}
          </span>
        </p>
      )}

      <p className="mt-1 text-[10px] text-[#848e9c]">{line1}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-[#848e9c]">{line2}</p>
        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${review.classes}`}>
          {review.label}
        </span>
      </div>
    </button>
  );
};

const RunList = ({ runs, selectedId, onSelect, filters, onFiltersChange, onRefresh, loading, error }) => {
  const setFilter = (key) => (e) => onFiltersChange({ ...filters, [key]: e.target.value });

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-[#131722] border border-[#2b3139] rounded-lg flex flex-col max-h-[60vh] lg:max-h-none lg:min-h-0">
      <div className="shrink-0 p-3 border-b border-[#2b3139] space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] tracking-wider text-[#848e9c] uppercase">Corridas ({runs.length})</h2>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Actualizar lista de corridas"
            className="p-1.5 rounded text-[#b7bdc6] hover:bg-[#1e2026]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-[10px] text-[#848e9c]">
            Modelo
            <select value={filters.model} onChange={setFilter("model")} className={selectClass}>
              <option value="">Todos</option>
              <option value="short">Short</option>
              <option value="long">Long</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-[#848e9c]">
            Intervalo
            <select value={filters.interval} onChange={setFilter("interval")} className={selectClass}>
              <option value="">Todos</option>
              {INTERVALS.map((iv) => (
                <option key={iv} value={iv}>{iv}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-[#848e9c]">
            Revisión
            <select value={filters.review_status} onChange={setFilter("review_status")} className={selectClass}>
              <option value="">Todas</option>
              {Object.entries(REVIEW_STATUSES).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto no-scrollbar">
        {error && <p className="text-xs text-[#f6465d]" role="alert">{error}</p>}
        {!error && !loading && runs.length === 0 && (
          <p className="text-xs text-[#848e9c]">
            No hay corridas con estos filtros. Corre <code>train_short.py</code> para registrar una.
          </p>
        )}
        {runs.map((run) => (
          <RunCard key={run.id} run={run} selected={run.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
    </aside>
  );
};

export default RunList;
