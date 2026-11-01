import { useEffect, useState } from "react";
import { fetchBacktest, fetchBacktestImageUrl } from "../../API/APIService";
import ConfigTable from "./ConfigTable";
import SignalsChart from "./SignalsChart";
import SignalsTable from "./SignalsTable";
import ReviewBox from "./ReviewBox";
import Modal from "./Modal";
import {
  RUN_STATUSES,
  formatIsoDisplay,
  formatMsDisplay,
  formatNumber,
  formatPct,
} from "./analyticsFormat";

const MODEL_LABEL = { short: "Short", long: "Long" };

const MetricCard = ({ label, value, hint, className = "text-[#eaecef]" }) => (
  <div className="bg-[#1e2026] rounded-md px-3 py-2">
    <p className="text-[11px] text-[#848e9c]">{label}</p>
    <p className={`text-lg font-bold leading-tight ${className}`}>{value}</p>
    {hint && <p className="text-[10px] text-[#5e6673]">{hint}</p>}
  </div>
);

const Metrics = ({ m }) => {
  const share = (n) => (m.signals ? `${((n / m.signals) * 100).toFixed(1)}% de las señales` : "");
  return (
    <section aria-label="Métricas" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
      <MetricCard label="Señales" value={m.signals} hint={`${formatNumber(m.signal_rate_pct, 2)}% de ${m.total_candles} velas`} />
      <MetricCard label="TP (aciertos)" value={m.tp} hint={share(m.tp)} className="text-[#0ecb81]" />
      <MetricCard label="SL" value={m.sl} hint={share(m.sl)} className="text-[#f6465d]" />
      <MetricCard label="Timeout" value={m.timeout} hint={share(m.timeout)} className="text-[#848e9c]" />
      <MetricCard label="Zonas reales" value={`${formatNumber(m.real_zones_pct, 1)}%`} hint="base: acierto al azar" />
      <MetricCard label="Precision" value={formatPct(m.precision)} />
      <MetricCard label="Recall" value={formatPct(m.recall)} />
      <MetricCard label="PR-AUC" value={formatNumber(m.pr_auc, 3)} hint={`${m.retrain_count} reentrenos`} />
    </section>
  );
};

const CodeInfo = ({ run, onShowCode }) => {
  const prev = run.previous;
  let text = "Primera corrida de este modelo e intervalo";
  let color = "text-[#848e9c]";
  if (prev) {
    const same = prev.code_hash === run.code_hash;
    text = same ? `Mismo código que #${prev.id}` : `El código cambió vs #${prev.id}`;
    color = same ? "text-[#848e9c]" : "text-[#f0b90b]";
  }
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span className={color}>{text}</span>
      <code className="text-[10px] text-[#5e6673]" title={run.code_hash}>
        código {run.code_hash?.slice(0, 12)}
      </code>
      <button type="button" onClick={onShowCode} className="text-[#3b82f6] hover:underline">
        Ver archivos
      </button>
    </div>
  );
};

const CodeModal = ({ run, onClose }) => {
  const files = Object.entries(run.code_files || {});
  const [active, setActive] = useState(files[0]?.[0]);
  const content = run.code_files?.[active] || "";
  return (
    <Modal title={`Código de la corrida #${run.id}`} onClose={onClose} wide>
      <div role="tablist" aria-label="Archivos" className="flex flex-wrap gap-2 mb-3">
        {files.map(([name]) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === active}
            onClick={() => setActive(name)}
            className={`text-xs rounded px-3 py-1 border ${
              name === active ? "bg-[#1e2a3a] border-[#3b82f6] text-[#eaecef]" : "bg-[#1e2026] border-[#2b3139] text-[#b7bdc6]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <pre className="text-[11px] leading-relaxed text-[#d1d4dc] bg-[#131722] border border-[#2b3139] rounded p-3 overflow-auto no-scrollbar whitespace-pre">
        {content}
      </pre>
    </Modal>
  );
};

const ImageModal = ({ runId, onClose }) => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    fetchBacktestImageUrl(runId)
      .then((u) => {
        objectUrl = u;
        if (!cancelled) setUrl(u);
      })
      .catch(() => !cancelled && setError("No se pudo cargar la imagen"));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [runId]);

  return (
    <Modal title={`Imagen de respaldo · corrida #${runId}`} onClose={onClose} wide>
      {error && <p className="text-sm text-[#f6465d]" role="alert">{error}</p>}
      {!error && !url && <p className="text-sm text-[#848e9c]" role="status">Cargando imagen…</p>}
      {url && <img src={url} alt={`Gráfica de señales de la corrida ${runId}`} className="w-full h-auto rounded" />}
    </Modal>
  );
};

const RunDetail = ({ runId, onReviewSaved }) => {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTs, setSelectedTs] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedTs(null);
    fetchBacktest(runId)
      .then((data) => !cancelled && setRun(data))
      .catch((err) => !cancelled && setError(err.response?.data?.detail || "No se pudo cargar la corrida"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (loading && !run) return <p className="p-6 text-sm text-[#848e9c]" role="status">Cargando corrida…</p>;
  if (error) return <p className="p-6 text-sm text-[#f6465d]" role="alert">{error}</p>;
  if (!run) return null;

  const status = RUN_STATUSES[run.status];
  const barMinutes = run.config?.minutes || 1;

  const handleReviewSaved = (saved) => {
    setRun((prev) => ({ ...prev, ...saved }));
    onReviewSaved(saved);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#eaecef]">
            #{run.id} · {MODEL_LABEL[run.model] || run.model} · {run.symbol} · {run.interval}
          </h2>
          <p className="text-[11px] text-[#848e9c]">
            {run.eval_from != null && `Evaluación: ${formatMsDisplay(run.eval_from)} → ${formatMsDisplay(run.eval_to)} · `}
            ejecutada {formatIsoDisplay(run.created_at)} · desde {run.source === "front" ? "el front" : "la terminal"} · hora UTC-6
          </p>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${status?.classes || ""}`}>{status?.label || run.status}</span>
      </header>

      <ConfigTable config={run.config} previous={run.previous} model={run.model} />
      <CodeInfo run={run} onShowCode={() => setShowCode(true)} />

      {run.status === "failed" && (
        <section aria-label="Error" className="bg-[#3a1d22]/40 border border-[#f6465d] rounded-md p-3">
          <p className="text-xs text-[#f6465d] mb-2">La corrida falló:</p>
          <pre className="text-[11px] text-[#eaecef] whitespace-pre-wrap break-words">{run.error}</pre>
        </section>
      )}

      {(run.status === "running" || run.status === "queued") && (
        <p className="text-sm text-[#3b82f6]" role="status">
          La corrida sigue en proceso. Actualiza la lista cuando termine para ver sus resultados.
        </p>
      )}

      {run.status === "done" && (
        <>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] tracking-wider text-[#848e9c] uppercase">Gráfica de señales</h3>
              {run.has_image && (
                <button type="button" onClick={() => setShowImage(true)} className="text-xs text-[#3b82f6] hover:underline">
                  Ver imagen de respaldo
                </button>
              )}
            </div>
            <SignalsChart
              runId={run.id}
              model={run.model}
              signals={run.signals || []}
              barSeconds={barMinutes * 60}
              selectedTs={selectedTs}
              onSelectSignal={setSelectedTs}
            />
          </div>

          <Metrics m={run.metrics || {}} />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
            <SignalsTable
              signals={run.signals || []}
              selectedTs={selectedTs}
              onSelect={setSelectedTs}
              barMinutes={barMinutes}
              model={run.model}
            />
            <ReviewBox run={run} onSaved={handleReviewSaved} />
          </div>

          <details className="bg-[#161a20] border border-[#2b3139] rounded-md">
            <summary className="cursor-pointer px-3 py-2 text-[11px] tracking-wider text-[#848e9c] uppercase">
              Hiperparámetros e importancia de features
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 text-xs">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(run.hyperparams || {}).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-[#848e9c]">{k}</dt>
                    <dd className="text-[#eaecef]">{String(v)}</dd>
                  </div>
                ))}
              </dl>
              <ol className="space-y-1">
                {(run.features || []).map((f) => (
                  <li key={f.name} className="flex items-center gap-2">
                    <span className="w-36 shrink-0 text-[#b7bdc6] truncate" title={f.name}>{f.name}</span>
                    <span className="flex-1 h-1.5 bg-[#2b3139] rounded">
                      <span
                        className="block h-full bg-[#3b82f6] rounded"
                        style={{ width: `${Math.min(100, (f.importance / (run.features[0]?.importance || 1)) * 100)}%` }}
                      />
                    </span>
                    <span className="w-12 text-right text-[#848e9c]">{formatNumber(f.importance, 3)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        </>
      )}

      {showCode && <CodeModal run={run} onClose={() => setShowCode(false)} />}
      {showImage && <ImageModal runId={run.id} onClose={() => setShowImage(false)} />}
    </div>
  );
};

export default RunDetail;
