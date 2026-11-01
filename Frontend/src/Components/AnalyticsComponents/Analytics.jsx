import { useCallback, useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { fetchBacktestJob, fetchBacktests } from "../../API/APIService";
import RunList from "./RunList";
import RunDetail from "./RunDetail";
import NewRunModal from "./NewRunModal";
import { formatIsoDisplay } from "./analyticsFormat";

const JOB_POLL_MS = 5000;

// Sección Analytics: revisión visual, prueba por prueba, de los backtests
// guardados por el laboratorio en backtest_runs.
const Analytics = () => {
  const [filters, setFilters] = useState({ model: "", interval: "", review_status: "" });
  const [runs, setRuns] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBacktests(filters);
      setRuns(data);
      // Mantener la selección si sigue en la lista; si no, elegir la más reciente.
      setSelectedId((current) => (data.some((r) => r.id === current) ? current : data[0]?.id ?? null));
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudieron cargar las corridas");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Refleja en la lista la revisión guardada en el detalle.
  const handleReviewSaved = (saved) => {
    setRuns((prev) => prev.map((r) => (r.id === saved.id ? { ...r, ...saved } : r)));
  };

  // --- Corrida lanzada desde el front ---
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [job, setJob] = useState({ running: false, job: null });
  const wasRunning = useRef(false);
  const loadRunsRef = useRef(loadRuns);
  loadRunsRef.current = loadRuns;

  // Estado al entrar (por si quedó una corrida en curso) y sondeo mientras corre.
  // Al empezar y al terminar se recarga la lista para ver la corrida nueva.
  const refreshJob = useCallback(async () => {
    try {
      const status = await fetchBacktestJob();
      setJob(status);
      if (wasRunning.current !== status.running) loadRunsRef.current();
      wasRunning.current = status.running;
    } catch {
      /* sin conexión: se reintenta en el siguiente ciclo */
    }
  }, []);

  useEffect(() => {
    refreshJob();
  }, [refreshJob]);

  useEffect(() => {
    if (!job.running) return undefined;
    const id = setInterval(refreshJob, JOB_POLL_MS);
    return () => clearInterval(id);
  }, [job.running, refreshJob]);

  const handleStarted = (status) => {
    setJob(status);
    wasRunning.current = status.running;
    // El script registra la corrida a los pocos segundos de arrancar.
    setTimeout(() => loadRunsRef.current(), 3000);
  };

  const selectedRun = runs.find((r) => r.id === selectedId);
  const jobInfo = job.job;
  const jobFailedEarly = !job.running && jobInfo && jobInfo.returncode !== 0 && jobInfo.error_tail;

  return (
    // En escritorio la página ocupa exactamente la pantalla menos el header
    // (~57px) y cada panel hace scroll por dentro. En móvil, scroll normal.
    <div className="min-h-[calc(100dvh-57px)] lg:h-[calc(100dvh-57px)] lg:overflow-hidden flex flex-col bg-[#0b0e11] text-[#eaecef]">
      <div className="shrink-0 px-4 pt-4 pb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Analytics · Pruebas de modelos</h1>
          <p className="text-xs text-[#848e9c]">
            Revisa cada corrida de backtest con su gráfica, configuración y señales.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewRunOpen(true)}
          disabled={job.running}
          title={job.running ? "Espera a que termine la corrida en curso" : undefined}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white bg-[#3b82f6] hover:bg-[#2f6fd8] disabled:opacity-40"
        >
          <FlaskConical size={14} aria-hidden="true" /> Nueva prueba
        </button>
      </div>

      {(job.running || jobFailedEarly) && (
        <div className="shrink-0 px-4" role="status">
          {job.running ? (
            <p className="text-xs rounded border border-[#3b82f6] bg-[#1e2a3a] text-[#b7bdc6] px-3 py-2">
              <span className="inline-block w-2 h-2 mr-2 rounded-full bg-[#3b82f6] animate-pulse" aria-hidden="true" />
              Corriendo {jobInfo.model} {jobInfo.interval} desde {formatIsoDisplay(jobInfo.started_at)} · tarda unos
              minutos; la lista se actualiza sola al terminar.
            </p>
          ) : (
            <pre className="text-[11px] whitespace-pre-wrap rounded border border-[#f6465d] bg-[#3a1d22] text-[#f6465d] px-3 py-2">
              La última prueba ({jobInfo.model} {jobInfo.interval}) falló:{"\n"}
              {jobInfo.error_tail.split("\n").slice(-2).join("\n")}
            </pre>
          )}
        </div>
      )}

      {newRunOpen && (
        <NewRunModal
          onClose={() => setNewRunOpen(false)}
          onStarted={handleStarted}
          initialModel={selectedRun?.model || filters.model || "long"}
          initialInterval={selectedRun?.interval || filters.interval || "15m"}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-4 p-4 pt-2 lg:flex-1 lg:min-h-0">
        <RunList
          runs={runs}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={loadRuns}
          loading={loading}
          error={error}
        />

        <section
          aria-label="Detalle de la corrida"
          className="flex-1 min-w-0 lg:min-h-0 lg:overflow-y-auto no-scrollbar bg-[#131722] border border-[#2b3139] rounded-lg p-4"
        >
          {selectedId ? (
            <RunDetail key={selectedId} runId={selectedId} onReviewSaved={handleReviewSaved} />
          ) : (
            !loading && (
              <p className="text-sm text-[#848e9c]">
                Selecciona una corrida de la lista para ver su detalle.
              </p>
            )
          )}
        </section>
      </div>
    </div>
  );
};

export default Analytics;
