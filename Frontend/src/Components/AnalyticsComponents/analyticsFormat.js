// Formato compartido de la sección Analytics.
// Las fechas llegan en UTC (ms o s) y se muestran en UTC-6, igual que Trading.

export const DISPLAY_UTC_OFFSET_HOURS = -6;
export const DISPLAY_OFFSET_SECONDS = DISPLAY_UTC_OFFSET_HOURS * 3600;

const pad = (n) => String(n).padStart(2, "0");

// Segundos UTC -> "YYYY-MM-DD HH:mm" en UTC-6. A prueba de valores inválidos.
export const formatSecondsDisplay = (seconds) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "";
  const d = new Date((seconds + DISPLAY_OFFSET_SECONDS) * 1000);
  if (isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

// Milisegundos UTC -> "YYYY-MM-DD HH:mm" en UTC-6.
export const formatMsDisplay = (ms) =>
  typeof ms === "number" ? formatSecondsDisplay(Math.floor(ms / 1000)) : "";

// Fecha ISO (created_at) -> "YYYY-MM-DD HH:mm" en UTC-6.
export const formatIsoDisplay = (iso) => {
  if (!iso) return "";
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : formatSecondsDisplay(Math.floor(t / 1000));
};

// Eje de tiempo de lightweight-charts: solo HH:mm en UTC-6.
export const formatAxisTime = (time) => {
  if (typeof time !== "number" || !Number.isFinite(time)) return "";
  const d = new Date((time + DISPLAY_OFFSET_SECONDS) * 1000);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

// Minutos -> texto legible: "45 min", "2 h", "2.4 días".
export const formatDuration = (minutes) => {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) return "";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${+hours.toFixed(1)} h`;
  return `${+(hours / 24).toFixed(1)} días`;
};

export const formatPct = (fraction, digits = 1) =>
  typeof fraction === "number" && Number.isFinite(fraction) ? `${(fraction * 100).toFixed(digits)}%` : "—";

export const formatNumber = (value, digits = 2) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";

// Campos de la config en el orden en que se muestran. `detail` traduce el valor
// a algo legible usando `minutes` de la propia config, así nunca se contradice.
const bars = (n, cfg) => `${n} velas · ${formatDuration(n * (cfg?.minutes || 0))}`;
const isVol = (cfg) => cfg?.barrier_mode === "vol";
// Dirección del modelo: el long gana subiendo y pierde bajando; el short al revés.
export const isLong = (model) => model === "long";
const move = (pct, up) => `${up ? "subida +" : "caída −"}${(pct * 100).toFixed(2)}%`;

export const CONFIG_FIELDS = [
  { key: "pandas_freq", label: "pandas_freq", detail: (v) => `${v}` },
  { key: "minutes", label: "minutes", detail: (v) => `${v} min por vela` },
  { key: "window_size", label: "window_size", detail: bars },
  // Corridas anteriores a esta opción usaban 90 días fijos y no traen el campo ("—").
  { key: "data_days", label: "data_days", detail: (v) => `${v} días de historia` },
  {
    key: "confirm_mode",
    label: "confirm_mode",
    detail: (v) =>
      ({
        close_below_prev_high: "cierre < máximo anterior",
        close_above_prev_low: "cierre > mínimo anterior",
      })[v] || "sin confirmación",
  },
  {
    key: "target_pct",
    label: "target_pct",
    detail: (v, cfg, model) => `${v} · ${move(v, isLong(model))}${isVol(cfg) ? " (no se usa en vol)" : ""}`,
  },
  { key: "target_horizon", label: "target_horizon", detail: bars },
  {
    key: "stop_loss",
    label: "stop_loss",
    detail: (v, cfg, model) => `${v} · ${move(Math.abs(v), !isLong(model))}${isVol(cfg) ? " (no se usa en vol)" : ""}`,
  },
  { key: "prob_threshold", label: "prob_threshold", detail: (v) => `≥ ${v}` },
  { key: "rsi_min_filter", label: "rsi_min_filter", detail: (v) => `RSI ≥ ${v}` },
  { key: "rsi_max_filter", label: "rsi_max_filter", detail: (v) => `RSI ≤ ${v}` },
  { key: "retrain_every", label: "retrain_every", detail: bars },
  {
    key: "bars",
    label: "bars",
    detail: (v) => (v && typeof v === "object" ? Object.entries(v).map(([k, n]) => `${k}=${n}`).join(" · ") : `${v}`),
  },
  // Barreras del target. Las corridas anteriores a esta opción no las traen: se ven como "—".
  {
    key: "barrier_mode",
    label: "barrier_mode",
    detail: (v) => (v === "vol" ? "vol · TP/SL por volatilidad" : `${v} · TP/SL fijos`),
  },
  { key: "vol_window", label: "vol_window", detail: (v, cfg) => `${v}${isVol(cfg) ? "" : " (solo en vol)"}` },
  { key: "tp_mult", label: "tp_mult", detail: (v, cfg) => `${v}σ${isVol(cfg) ? "" : " (solo en vol)"}` },
  { key: "sl_mult", label: "sl_mult", detail: (v, cfg) => `${v}σ${isVol(cfg) ? "" : " (solo en vol)"}` },
  {
    key: "min_tp_pct",
    label: "min_tp_pct",
    detail: (v, cfg) => `${v} · TP ≥ ${(v * 100).toFixed(2)}%${isVol(cfg) ? "" : " (solo en vol)"}`,
  },
];

// Resumen corto de la config para las tarjetas de la lista.
export const configSummary = (cfg) => {
  if (!cfg) return ["", ""];
  return [
    `win ${cfg.window_size} · tgt ${(cfg.target_pct * 100).toFixed(1)}% · hz ${cfg.target_horizon} · SL ${(Math.abs(cfg.stop_loss) * 100).toFixed(1)}%`,
    `prob ${cfg.prob_threshold} · RSI ${
      cfg.rsi_max_filter != null ? `≤${cfg.rsi_max_filter}` : `≥${cfg.rsi_min_filter}`
    } · retrain ${cfg.retrain_every}`,
  ];
};

export const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Resultado de una señal.
export const OUTCOMES = {
  tp: { label: "Acierto (TP)", short: "TP", color: "#0ecb81", text: "text-[#0ecb81]" },
  sl: { label: "Fallo (SL)", short: "SL", color: "#f6465d", text: "text-[#f6465d]" },
  timeout: { label: "Sin resultado", short: "Timeout", color: "#848e9c", text: "text-[#848e9c]" },
};

// Estado de revisión manual.
export const REVIEW_STATUSES = {
  pending: { label: "Sin revisar", classes: "bg-[#2b3139] text-[#b7bdc6] border-[#2b3139]" },
  promising: { label: "Prometedora", classes: "bg-[#123227] text-[#0ecb81] border-[#0ecb81]" },
  review: { label: "Revisar", classes: "bg-[#2b2a18] text-[#f0b90b] border-[#f0b90b]" },
  discarded: { label: "Descartada", classes: "bg-[#3a1d22] text-[#f6465d] border-[#f6465d]" },
};

// Estado de ejecución de la corrida.
export const RUN_STATUSES = {
  queued: { label: "En cola", classes: "bg-[#2b3139] text-[#b7bdc6]" },
  running: { label: "Corriendo", classes: "bg-[#1e2a3a] text-[#3b82f6]" },
  done: { label: "Terminada", classes: "bg-[#123227] text-[#0ecb81]" },
  failed: { label: "Falló", classes: "bg-[#3a1d22] text-[#f6465d]" },
};
