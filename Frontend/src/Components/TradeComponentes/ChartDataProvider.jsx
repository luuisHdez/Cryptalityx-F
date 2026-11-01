import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchHistoricalData, fetchLiveSignals, fetchUpdatedData, submitOperationConfig, stopOperation, syncPosition, updateBinanceData } from "../../API/APIService";
import { toast } from "react-toastify";
import ChartControls from "./ChartControls";
import CandleChart from "./CandleChart";
import ToolInput from "./ToolInput";
import { useLocation } from "react-router-dom";
import MarkTicket from "./MarkTicket";
import TableResults from "./TableResults";
import TradingPanel from "./TradingPanel";
import PositionPanel from "./PositionPanel";
import IndicatorAlertPanel from "./IndicatorAlertPanel";
import TelegramLinkModal from "./TelegramLinkModal";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  subscribeToSymbol,
  listenToData,
  listenToSignals,
  stopListening,
  listeningOperationActivated,
} from "../../API/trade_api";
import { useSocket } from "../../contexts/SocketContext";
const ALL_INTERVALS = [
  { value: "1s", label: "1s" },
  { value: "1m", label: "1m" },
  { value: "3m", label: "3m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1H" },
  { value: "2h", label: "2H" },
  { value: "4h", label: "4H" },
  { value: "6h", label: "6H" },
  { value: "8h", label: "8H" },
  { value: "12h", label: "12H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1M", label: "1M" },
];

const DEFAULT_PINNED = ["1m", "5m", "15m", "1h", "4h", "1d"];

const INITIAL_TOOL_STATES = {
  active_alerts: false,
  active_operations: false,
  stop_loss: { visible: false, value: "" },
  take_profit: { visible: false, value: "" },
  entry_point: { visible: false, value: "" },
  take_benefit: { visible: false, value: "" },
  alert_up: { visible: false, value: "" },
  alert_down: { visible: false, value: "" },
};

// Une dos listas de velas, deduplica por 'time' (la última gana) y devuelve el
// array ordenado ascendentemente por tiempo, como exige lightweight-charts.
const mergeCandles = (...lists) => {
  const byTime = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const candle of list) {
      if (candle && candle.time != null) {
        byTime.set(candle.time, candle);
      }
    }
  }
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
};

// Igual para las señales ML: una por (modelo, vela), ordenadas por ts.
const mergeSignals = (...lists) => {
  const byKey = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const s of list) {
      if (s && s.ts != null) byKey.set(`${s.model}:${s.ts}`, s);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.ts - b.ts);
};

const ChartDataProvider = ({ symbol, interval, setSymbol, setInterval, operationConfig }) => {
  const [candles, setCandles] = useState([]);
  // Señales ML (long/short) del rango de velas cargado, solo de este intervalo.
  const [signals, setSignals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [toolStates, setToolStates] = useState(INITIAL_TOOL_STATES);
  const location = useLocation();
  const [currentPrice, setCurrentPrice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const hasReset = useRef(false);
  const [pinnedIntervals, setPinnedIntervals] = useState(() => {
    const saved = localStorage.getItem("pinnedIntervals");
    return saved ? JSON.parse(saved) : DEFAULT_PINNED;
  });
  const [intervalPopupOpen, setIntervalPopupOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [symbolPopupOpen, setSymbolPopupOpen] = useState(false);
  const [dateRange, setDateRange] = useState(undefined);

 

  const { socket } = useSocket();
  useEffect(() => {
    if (!symbol || !interval) return;

    let isMounted = true;
    setLoading(true);
    setHasFetched(false);
    setSignals([]);

    const loadAndUpdate = async () => {
      try {
        const updated = await fetchUpdatedData(symbol, interval);
        if (!isMounted) return;
        // Aseguramos orden ascendente y sin duplicados antes de pintar.
        const merged = mergeCandles(updated || []);
        setCandles(merged);
        setHasFetched(true);
        // Señales solo del rango de velas cargado (desde la primera vela).
        if (merged.length) {
          const sigs = await fetchLiveSignals(symbol, interval, merged[0].time * 1000);
          if (isMounted) setSignals((prev) => mergeSignals(prev, sigs));
        }
      } catch (err) {
        console.error("❌ Error al cargar datos actualizados", err);
        setCandles([]);
        setError("Error al cargar datos.");
        setHasFetched(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };


    loadAndUpdate();
    return () => {
      isMounted = false;
    };
  }, [symbol, interval]);


  // Señal ML en vivo: solo se pinta si es del símbolo y del intervalo que se
  // está viendo (la flecha debe caer en una vela de ese intervalo).
  const handleSignal = useCallback((s) => {
    if (!s || s.symbol !== symbol.toUpperCase() || s.interval !== interval) return;
    setSignals((prev) => mergeSignals(prev, [s]));
  }, [symbol, interval]);

  //----------------
  const handleSocketData = useCallback((message) => {

    // Actualización de velas
    if (message?.e === "kline" && message.s === symbol.toUpperCase()) {
      const k = message.k;
      // Filtrar por intervalo: el payload de Binance trae el intervalo en k.i.
      // Si no coincide con el intervalo del chart, el tick pertenece a otro
      // stream (p.ej. una suscripción anterior que aún no se cerró) y NO debe
      // tocar las velas: su k.v es el volumen de OTRO periodo y mezclarlo
      // descuadra la barra de volumen respecto a Binance.
      if (k.i && k.i !== interval) {
        return;
      }
      // UTC real (sin restar 6h). El histórico también viene en UTC real ahora;
      // la zona horaria de visualización (UTC-6) se aplica en el CandleChart.
      // Restar 6h aquí desincronizaba la vela viva del histórico y "atoraba"
      // el gráfico (las velas nuevas caían 6h atrás y no se dibujaban).
      const adjustedTime = Math.floor(k.t / 1000);

      const o = Number(k.o);
      const h = Number(k.h);
      const l = Number(k.l);
      const c = Number(k.c);

      // Defensa: descartar velas con OHLC no válido (precios <= 0 o NaN)
      // para evitar que un dato anómalo pinte una vela cayendo a 0.
      if (![o, h, l, c].every((v) => Number.isFinite(v) && v > 0)) {
        return;
      }

      const formatted = {
        time: adjustedTime,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: Number(k.v)
      };
      setCurrentPrice(Number(k.c));
      setCandles((prev) => {
        if (prev.length === 0) return [formatted];
        const last = prev[prev.length - 1];
        // Mismo tiempo que la última → actualizar la vela en curso.
        if (formatted.time === last.time) {
          return [...prev.slice(0, -1), formatted];
        }
        // Posterior → añadir al final (caso normal de vela nueva).
        if (formatted.time > last.time) {
          return [...prev, formatted];
        }
        // Anterior a la última (desalineación de intervalo / dato rezagado):
        // NO romper el orden. Si coincide con alguna vela existente, se
        // reemplaza; si no, se ignora para no violar el orden ascendente.
        const idx = prev.findIndex((c) => c.time === formatted.time);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = formatted;
          return copy;
        }
        return prev;
      });
    }

    // Si el backend ya no reconoce al usuario, ignorar el mensaj

    // Actualización de operación
    if (message?.status === false) {
      if (hasReset.current) return; // ✅ Ya se reseteó una vez, ignorar
      hasReset.current = true;
      console.log("❌ Operación cerrada. Limpiando valores (se conservan alertas).");
      // Se limpian entry/TP/SL/take_benefit pero se CONSERVAN alert_up y
      // alert_down. Los valores de las alertas se toman del propio mensaje
      // (Redis), no de prev, y solo se muestran si son > 0 (un "0.0000" no es
      // una alerta real y no debe pintar una línea).
      const auVal = message.alert_up ? parseFloat(message.alert_up) : 0;
      const adVal = message.alert_down ? parseFloat(message.alert_down) : 0;
      setToolStates((prev) => ({
        ...INITIAL_TOOL_STATES,
        alert_up: {
          value: auVal || prev.alert_up.value,
          visible: !!(auVal || prev.alert_up.value),
        },
        alert_down: {
          value: adVal || prev.alert_down.value,
          visible: !!(adVal || prev.alert_down.value),
        },
      }));


    } else if (message?.status === true) {
       hasReset.current = false;
      //console.log("📩 Actualización de operación activa:", message);
      setToolStates((prev) => ({
        ...prev,
        entry_point: {
          ...prev.entry_point,
          value: message.entry_point ? parseFloat(message.entry_point) : prev.entry_point.value,
          visible: !!message.entry_point,
        },
        alert_up: {
          ...prev.alert_up,
          value: message.alert_up ? parseFloat(message.alert_up) : prev.alert_up.value,
          visible: !!message.alert_up,
        },
        alert_down: {
          ...prev.alert_down,
          value: message.alert_down ? parseFloat(message.alert_down) : prev.alert_down.value,
          visible: !!message.alert_down,
        },
        take_profit: {
          ...prev.take_profit,
          value: message.take_profit ? parseFloat(message.take_profit) : prev.take_profit.value,
          visible: !!message.take_profit,
        },
        stop_loss: {
          ...prev.stop_loss,
          value: message.stop_loss ? parseFloat(message.stop_loss) : prev.stop_loss.value,
          visible: !!message.stop_loss,
        },
        take_benefit: {
          ...prev.take_benefit,
          value: message.take_benefit ? parseFloat(message.take_benefit) : prev.take_benefit.value,
          visible: !!message.take_benefit,
        },
        active_alerts: true,
      }));

    }

  }, [symbol, interval]);


  useEffect(() => {
    console.log("🚀 useEffect suscripción:", {
      pathname: location.pathname,
      symbol,
      interval,
      connected: socket?.connected,
    });
    // si la ruta no empieza con /trading o el socket no existe, salimos
    if (!location.pathname.startsWith("/trading") || !socket) return;

    const subscribeAndListen = () => {
      subscribeToSymbol(socket, symbol, interval);
      listenToData(socket, handleSocketData);
      listeningOperationActivated(socket, handleSocketData);
      listenToSignals(socket, handleSignal);
    };

    if (socket.connected) {
      subscribeAndListen();
    } else {
      socket.once("connect", subscribeAndListen);
    }
    socket.on("connect", subscribeAndListen);

    return () => {
      stopListening(socket);
      socket.off("connect", subscribeAndListen);
    };
  }, [socket, symbol, interval, location.pathname, handleSocketData, handleSignal]);





  useEffect(() => {
    if (!operationConfig) return;

    console.log("📩 operation_activated received:", operationConfig);

    if (operationConfig.status === false) {
      setToolStates((prev) => ({
        ...INITIAL_TOOL_STATES,
        alert_up: { ...prev.alert_up, visible: true },
        alert_down: { ...prev.alert_down, visible: true },
      })); // 🔧 Resetea todo correctamente
    } else {
      setToolStates((prev) => ({
        ...prev,
        entry_point: {
          ...prev.entry_point,
          value: operationConfig.entry_point ? parseFloat(operationConfig.entry_point) : prev.entry_point.value,
          visible: !!operationConfig.entry_point,
        },
        alert_up: {
          ...prev.alert_up,
          value: operationConfig.alert_up ? parseFloat(operationConfig.alert_up) : prev.alert_up.value,
          visible: !!operationConfig.alert_up,
        },
        alert_down: {
          ...prev.alert_down,
          value: operationConfig.alert_down ? parseFloat(operationConfig.alert_down) : prev.alert_down.value,
          visible: !!operationConfig.alert_down,
        },
        take_profit: {
          ...prev.take_profit,
          value: operationConfig.take_profit ? parseFloat(operationConfig.take_profit) : prev.take_profit.value,
          visible: !!operationConfig.take_profit,
        },
        stop_loss: {
          ...prev.stop_loss,
          value: operationConfig.stop_loss ? parseFloat(operationConfig.stop_loss) : prev.stop_loss.value,
          visible: !!operationConfig.stop_loss,
        },
        take_benefit: {
          ...prev.take_benefit,
          value: operationConfig.take_benefit ? parseFloat(operationConfig.take_benefit) : prev.take_benefit.value,
          visible: !!operationConfig.take_benefit,
        },
        active_alerts: operationConfig.status === true,
      }));
    }
  }, [operationConfig]);

  const handleLoadMoreData = useCallback(async (beforeTime) => {
    // Timestamps en UTC real (igual que el backend): se envía tal cual.
    const adjustedBefore = beforeTime;
    console.log("🔔 handleLoadMoreData llamado con beforeTime=", beforeTime);
    try {
      const newData = await fetchHistoricalData(symbol, interval, adjustedBefore);
      if (newData && newData.length > 0) {
        // Mezclar histórico nuevo + actual, deduplicar por 'time' y ordenar
        // ascendente. La librería del gráfico exige orden estricto por tiempo;
        // sin esto, al cambiar de intervalo aparecen velas fuera de orden.
        setCandles(prev => mergeCandles(prev, newData));
        // Señales del tramo recién cargado (hasta la vela anterior a `beforeTime`).
        const sorted = mergeCandles(newData);
        const sigs = await fetchLiveSignals(
          symbol, interval, sorted[0].time * 1000, beforeTime != null ? beforeTime * 1000 - 1 : null
        );
        setSignals(prev => mergeSignals(prev, sigs));
      } else {
        console.log("📭 No se encontraron más datos históricos.");
      }
    } catch (error) {
      console.error("❌ Error al cargar más datos históricos:", error);
    }
  }, [symbol, interval]);

  const mappedToolStates = {
    stop_loss: toolStates.stop_loss,
    take_profit: toolStates.take_profit,
    entry_point: toolStates.entry_point,
    break_even: toolStates.take_benefit,
    alert_up: toolStates.alert_up,
    alert_down: toolStates.alert_down,
    active_alerts: toolStates.active_alerts,
    active_operations: toolStates.active_operations
  };

  return (
    <div className="relative">

      {/* Single top bar: Symbol | Intervals | Actions */}
      <div className="w-full bg-[#181A20] border border-blue-900 px-3 py-1.5 flex items-center justify-between relative">
        {/* Left: Symbol selector + price */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSymbolPopupOpen(!symbolPopupOpen)}>
            <span className="text-white font-medium text-sm">{symbol.toUpperCase()}</span>
            <svg className={`w-3 h-3 text-gray-400 transition-transform ${symbolPopupOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.37 8.75H7.63a.75.75 0 00-.569 1.238l4.37 5.098c.299.349.84.349 1.138 0l4.37-5.098a.75.75 0 00-.57-1.238z"/>
            </svg>
          </div>
          {currentPrice && (
            <span className="text-green-400 font-medium text-sm">{currentPrice.toFixed(4)}</span>
          )}
          {symbolPopupOpen && (
            <div className="absolute top-full left-2 mt-1 z-50 bg-[#1e2230] border border-gray-700 rounded-lg p-2 shadow-2xl w-[200px]">
              {["xrpusdt", "btcusdt", "ethusdt"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setCandles([]); setSymbol(s); setSymbolPopupOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded text-xs ${symbol === s ? "text-yellow-400 bg-yellow-900/20" : "text-white hover:bg-gray-700"}`}
                >
                  {s.toUpperCase().replace("USDT", "/USDT")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Interval buttons */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 mr-1">Tiempo</span>
          {pinnedIntervals.map((iv) => {
            const found = ALL_INTERVALS.find((a) => a.value === iv);
            if (!found) return null;
            return (
              <button
                key={iv}
                onClick={() => { setCandles([]); setInterval(iv); }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  interval === iv
                    ? "text-yellow-400 bg-yellow-900/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {found.label}
              </button>
            );
          })}
          <button
            onClick={() => setIntervalPopupOpen(!intervalPopupOpen)}
            className="ml-1 flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-gray-300 hover:text-white border border-gray-700 rounded"
          >
            <svg className={`w-3 h-3 transition-transform ${intervalPopupOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.37 8.75H7.63a.75.75 0 00-.569 1.238l4.37 5.098c.299.349.84.349 1.138 0l4.37-5.098a.75.75 0 00-.57-1.238z"/>
            </svg>
          </button>
        </div>

        {/* Right: Action buttons with labels */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-white">Alerts</label>
            <button
              onClick={() => setToolStates(prev => ({ ...prev, active_alerts: !prev.active_alerts }))}
              className={`w-7 h-3.5 flex items-center rounded-full p-0.5 ${toolStates.active_alerts ? "bg-green-500" : "bg-gray-600"}`}
            >
              <div className={`w-2.5 h-2.5 bg-white rounded-full transform transition ${toolStates.active_alerts ? "translate-x-3" : "translate-x-0"}`} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-white">Ops</label>
            <button
              onClick={() => setToolStates(prev => ({ ...prev, active_operations: !prev.active_operations }))}
              className={`w-7 h-3.5 flex items-center rounded-full p-0.5 ${toolStates.active_operations ? "bg-blue-500" : "bg-gray-600"}`}
            >
              <div className={`w-2.5 h-2.5 bg-white rounded-full transform transition ${toolStates.active_operations ? "translate-x-3" : "translate-x-0"}`} />
            </button>
          </div>
          <button onClick={() => setDateModalOpen(true)} className="px-2 py-0.5 rounded text-[10px] text-blue-300 border border-blue-800/50 bg-blue-950/30 hover:bg-blue-900/50 transition">📅 Rango</button>
          <button onClick={async () => { try { await stopOperation(symbol); toast.success("🛑 Stop", { theme: "dark" }); } catch { toast.error("❌ Error", { theme: "dark" }); } }} className="px-2 py-0.5 rounded text-[10px] text-red-300 border border-red-800/50 bg-red-950/30 hover:bg-red-900/50 transition">⛔ Stop</button>
          <button onClick={() => setAlertPanelOpen(true)} className="px-2 py-0.5 rounded text-[10px] text-orange-300 border border-orange-800/50 bg-orange-950/30 hover:bg-orange-900/50 transition">🔔 Alerts</button>
          <button onClick={async () => { try { const result = await syncPosition(symbol); if (result.status === "success") toast.success(`✅ Entry: ${result.entry_point}`, { theme: "dark" }); else toast.info("ℹ️ Sin posición", { theme: "dark" }); } catch { toast.error("❌ Error sync", { theme: "dark" }); } }} className="px-2 py-0.5 rounded text-[10px] text-teal-300 border border-teal-800/50 bg-teal-950/30 hover:bg-teal-900/50 transition">🔄 Sync</button>
          <button onClick={() => setTelegramModalOpen(true)} className="px-2 py-0.5 rounded text-[10px] text-sky-300 border border-sky-800/50 bg-sky-950/30 hover:bg-sky-900/50 transition">✈️ Telegram</button>
        </div>

        {/* Interval Config Popup */}
        {intervalPopupOpen && (
          <div className="absolute top-full left-1/3 mt-1 z-50 bg-[#1e2230] border border-gray-700 rounded-xl p-4 shadow-2xl w-[320px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white font-medium">Anclado</span>
              <button onClick={() => { localStorage.setItem("pinnedIntervals", JSON.stringify(pinnedIntervals)); setIntervalPopupOpen(false); }} className="text-[10px] text-yellow-400 hover:text-yellow-300 font-medium">Guardar</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {pinnedIntervals.map((iv) => {
                const found = ALL_INTERVALS.find((a) => a.value === iv);
                return (
                  <div key={iv} className="relative">
                    <div className="flex items-center justify-center w-[56px] h-[24px] bg-gray-700 rounded text-[10px] text-white">{found?.label || iv}</div>
                    <button onClick={() => setPinnedIntervals((prev) => prev.filter((p) => p !== iv))} className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-red-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-4 9.1a.9.9 0 000 1.8h8a.9.9 0 000-1.8H8z"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-white font-medium mb-2">Disponible</div>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERVALS.filter((a) => !pinnedIntervals.includes(a.value)).map((iv) => (
                <div key={iv.value} className="relative">
                  <div className="flex items-center justify-center w-[56px] h-[24px] bg-gray-700 rounded text-[10px] text-white">{iv.label}</div>
                  <button onClick={() => setPinnedIntervals((prev) => [...prev, iv.value])} className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-green-400">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 5.1a.9.9 0 00-.9.9v3.1H8a.9.9 0 000 1.8h3.1V16a.9.9 0 001.8 0v-3.1H16a.9.9 0 000-1.8h-3.1V8a.9.9 0 00-.9-.9z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <IndicatorAlertPanel isOpen={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} symbol={symbol} />
      {telegramModalOpen && <TelegramLinkModal onClose={() => setTelegramModalOpen(false)} />}

      {/* Modal de rango de fechas */}
      {dateModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setDateModalOpen(false)}
        >
          <div
            className="bg-[#0b0e11] border border-slate-700 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 bg-[#131722] border-b border-slate-700">
              <h2 className="text-sm font-semibold text-white">Seleccionar Rango</h2>
              <button onClick={() => setDateModalOpen(false)} className="text-gray-400 hover:text-white text-xl leading-none px-1">✕</button>
            </div>
            <div className="p-4">
              <DayPicker mode="range" required selected={dateRange} onSelect={setDateRange} />
            </div>
            <div className="px-5 py-3 bg-[#131722] border-t border-slate-700 flex justify-between items-center">
              <span className="text-[10px] text-gray-400">
                {dateRange?.from && dateRange?.to
                  ? `${dateRange.from.toLocaleDateString()} → ${dateRange.to.toLocaleDateString()}`
                  : "Selecciona inicio y fin"}
              </span>
              <button
                onClick={async () => {
                  if (!dateRange?.from || !dateRange?.to) return;
                  try {
                    const startDate = dateRange.from.toISOString().split("T")[0];
                    const endDate = dateRange.to.toISOString().split("T")[0];
                    await updateBinanceData(startDate, endDate, symbol);
                    const updatedData = await fetchHistoricalData(symbol, interval);
                    setCandles(updatedData);
                    toast.success("✅ Datos cargados", { theme: "dark" });
                    setDateModalOpen(false);
                  } catch (error) {
                    toast.error("❌ Error al cargar datos", { theme: "dark" });
                  }
                }}
                disabled={!dateRange?.from || !dateRange?.to}
                className="text-[10px] px-4 py-1.5 border border-blue-700 rounded text-white bg-blue-900/50 hover:bg-blue-800/70 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal: Chart + Sidebar */}
      <div className="flex h-[500px] overflow-hidden">
        {/* Chart - se encoge horizontalmente, altura fija */}
        <div className="flex-1 min-w-0 relative h-full">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 rounded">
              <div className="chart-loader"></div>
            </div>
          )}
          <div className="mx-1 h-full">
            <CandleChart
              data={candles}
              signals={signals}
              toolStates={toolStates}
              setToolStates={setToolStates}
              onLoadMore={handleLoadMoreData}
            />
          </div>
        </div>

        {/* Botón toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-6 bg-[#131722] border-x border-blue-900 flex items-center justify-center hover:bg-[#1e2433] transition-colors shrink-0 h-full"
          title={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
        >
          <span className="text-gray-300 text-sm font-bold">{sidebarOpen ? "›" : "‹"}</span>
        </button>

        {/* Sidebar */}
        <div
          className={`bg-[#181A20] flex flex-col justify-between overflow-y-auto shrink-0 h-full transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-[220px] p-2 border-l border-blue-900" : "w-0 p-0 overflow-hidden"
          }`}
        >
          {/* Grupo: Alertas de precio */}
          <div className="space-y-2">
            <p className="text-xs text-white font-semibold uppercase tracking-wider">Alertas</p>
            <div>
              <label className="text-xs text-gray-200">Alert Up</label>
              <input
                type="number"
                step="0.0001"
                value={toolStates.alert_up.value || ""}
                onChange={(e) => {
                  const v = parseFloat(parseFloat(e.target.value).toFixed(4));
                  if (!isNaN(v)) setToolStates(prev => ({ ...prev, alert_up: { ...prev.alert_up, value: v, visible: v !== 0 } }));
                }}
                disabled={!toolStates.active_alerts}
                className="w-full p-1 rounded bg-gray-900 text-white border border-blue-800 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-200">Alert Down</label>
              <input
                type="number"
                step="0.0001"
                value={toolStates.alert_down.value || ""}
                onChange={(e) => {
                  const v = parseFloat(parseFloat(e.target.value).toFixed(4));
                  if (!isNaN(v)) setToolStates(prev => ({ ...prev, alert_down: { ...prev.alert_down, value: v, visible: v !== 0 } }));
                }}
                disabled={!toolStates.active_alerts}
                className="w-full p-1 rounded bg-gray-900 text-white border border-blue-800 text-xs"
              />
            </div>
          </div>

          {/* Grupo: Operación */}
          <div className="space-y-2 mt-3">
            <p className="text-xs text-white font-semibold uppercase tracking-wider">Operación</p>
            <div>
              <label className="text-xs text-gray-200">Take Profit</label>
              <input
                type="number"
                step="0.0001"
                value={toolStates.take_profit.value || ""}
                onChange={(e) => {
                  const v = parseFloat(parseFloat(e.target.value).toFixed(4));
                  if (!isNaN(v)) setToolStates(prev => ({ ...prev, take_profit: { ...prev.take_profit, value: v, visible: v !== 0 } }));
                }}
                disabled={!toolStates.active_alerts}
                className="w-full p-1 rounded bg-gray-900 text-white border border-blue-800 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-200">Stop Loss</label>
              <input
                type="number"
                step="0.0001"
                value={toolStates.stop_loss.value || ""}
                onChange={(e) => {
                  const v = parseFloat(parseFloat(e.target.value).toFixed(4));
                  if (!isNaN(v)) setToolStates(prev => ({ ...prev, stop_loss: { ...prev.stop_loss, value: v, visible: v !== 0 } }));
                }}
                disabled={!toolStates.active_alerts}
                className="w-full p-1 rounded bg-gray-900 text-white border border-blue-800 text-xs"
              />
            </div>
          </div>

          {/* Grupo: Solo lectura */}
          <div className="space-y-2 mt-3">
            <p className="text-xs text-white font-semibold uppercase tracking-wider">Estado</p>
            <div>
              <label className="text-xs text-gray-200">Entry Point</label>
              <input
                type="number"
                value={toolStates.entry_point.value || ""}
                disabled
                className="w-full p-1 rounded bg-gray-900 text-white border border-blue-800 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-200">Take Benefit</label>
              <input
                type="number"
                value={toolStates.take_benefit.value || ""}
                disabled
                className="w-full p-1 rounded bg-gray-900 text-white border border-blue-800 text-xs"
              />
            </div>
          </div>

          {/* Botón SendConfig */}
          <button
            onClick={async () => {
              try {
                if (!toolStates.active_alerts) {
                  toast.error("⚠️ Activa las alertas antes de enviar.", { theme: "dark" });
                  return;
                }
                const values = {
                  alert_up: Number(toolStates.alert_up.value).toFixed(4),
                  alert_down: Number(toolStates.alert_down.value).toFixed(4),
                  active_alerts: !!toolStates.active_alerts,
                  active_operations: !!toolStates.active_operations,
                };
                await submitOperationConfig(symbol, values);
                toast.success("✅ Config enviada", { theme: "dark" });
              } catch (error) {
                toast.error("❌ Error al enviar config", { theme: "dark" });
              }
            }}
            className="w-full mt-2 py-1.5 text-[10px] font-semibold uppercase text-white border border-yellow-700 rounded bg-neutral-900 hover:bg-yellow-900/30 transition"
          >
            SendConfig
          </button>
        </div>
      </div>

      {/* Posición abierta (solo aparece si hay posición en futuros) */}
      <PositionPanel />

      {/* TradingPanel */}
      <TradingPanel symbol={symbol} />

      {/* TableResults abajo */}
      <div className="w-full bg-[#181A20] p-2 border border-blue-900 flex gap-2 overflow-x-auto whitespace-nowrap justify-center">
        <TableResults symbol={symbol} />
      </div>

      {!loading && hasFetched && candles.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No hay datos disponibles.
        </p>
      )}
    </div>
  );



};

export default ChartDataProvider;
