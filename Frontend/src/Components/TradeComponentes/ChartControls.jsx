import React, { useState } from "react";
import {
  updateBinanceData, fetchHistoricalData,
  stopOperation, syncPosition
} from "../../API/APIService";
import { toast } from 'react-toastify'
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import IndicatorAlertPanel from "./IndicatorAlertPanel";

const ChartControls = ({
  setCandles,
  setSymbol,
  setInterval,
  symbol,
  interval,
  toolStates,
  setToolStates,
}) => {
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
  });
  const [dateRange, setDateRange] = useState(undefined);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const handleSymbolChange = (e) => {
    setCandles([]);
    setSymbol(e.target.value);
  };

  const toggleTool = (tool) => {
    setToolStates((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], visible: !prev[tool].visible },
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("⚠️ Selecciona un rango de fechas", { theme: "dark" });
      return;
    }
    try {
      const startDate = dateRange.from.toISOString().split("T")[0];
      const endDate = dateRange.to.toISOString().split("T")[0];
      const result = await updateBinanceData(startDate, endDate, symbol);
      console.log("✅ Datos actualizados:", result);

      if (symbol && interval) {
        const updatedData = await fetchHistoricalData(symbol, interval);
        setCandles(updatedData);
        setSymbol(symbol);
      }
      toast.success("✅ Datos cargados", { theme: "dark" });
    } catch (error) {
      console.error("❌ Error en la petición:", error);
      toast.error("❌ Error al cargar datos", { theme: "dark" });
    }
  };


  return (
    <div className="flex flex-wrap items-center justify-center gap-1 text-xs px-1 mt-2 mb-1">
      {/* Selects y switches */}
      <div className="flex flex-wrap items-center gap-1">
        <select
          value={symbol}
          onChange={handleSymbolChange}
          className="min-w-[90px] bg-gray-800 text-white border border-blue-700 rounded px-1 py-0.5"
        >
          <option value="xrpusdt">XRP/USDT</option>
          <option value="btcusdt">BTC/USDT</option>
          <option value="ethusdt">ETH/USDT</option>
        </select>

        <select
          value={interval}
          onChange={(e) => { setCandles([]); setInterval(e.target.value); }}
          className="min-w-[50px] bg-gray-800 text-white border border-blue-700 rounded px-1 py-1"
        >
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="1d">1d</option>
        </select>

        <div className="flex items-center space-x-1">
          <label className="text-white">Alerts</label>
          <button
            onClick={() =>
              setToolStates(prev => ({
                ...prev,
                active_alerts: !prev.active_alerts,
              }))
            }
            className={`w-8 h-4 flex items-center rounded-full p-0.5 ${toolStates.active_alerts ? "bg-green-500" : "bg-gray-400"
              }`}
          >
            <div
              className={`w-3 h-3 bg-white rounded-full transform transition ${toolStates.active_alerts ? "translate-x-4" : "translate-x-0"
                }`}
            />
          </button>
        </div>
        <div className="flex items-center space-x-1">
          <label className="text-white">Operations</label>
          <button
            onClick={() =>
              setToolStates(prev => ({
                ...prev,
                active_operations: !prev.active_operations,
              }))
            }
            className={`w-8 h-4 flex items-center rounded-full p-0.5 ${toolStates.active_operations ? "bg-blue-500" : "bg-gray-400"
              }`}
          >
            <div
              className={`w-3 h-3 bg-white rounded-full transform transition ${toolStates.active_operations ? "translate-x-4" : "translate-x-0"
                }`}
            />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="flex items-center justify-center gap-2 w-full flex-nowrap"
      >

        <button
          type="button"
          onClick={() => setDateModalOpen(true)}
          className="px-4 py-1.5 rounded-md text-xs font-medium text-blue-300 border border-blue-800/50 bg-blue-950/30 hover:bg-blue-900/50 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)] active:scale-95 transition-all duration-150"
        >
          📅 Rango
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              const result = await stopOperation(symbol);
              toast.success("🛑 Operación detenida", { theme: "dark" });
            } catch (error) {
              toast.error("❌ Error al detener", { theme: "dark" });
            }
          }}
          className="px-4 py-1.5 rounded-md text-xs font-medium text-red-300 border border-red-800/50 bg-red-950/30 hover:bg-red-900/50 hover:shadow-[0_0_8px_rgba(239,68,68,0.3)] active:scale-95 transition-all duration-150"
        >
          ⛔ Stop
        </button>

        <button
          type="button"
          onClick={() => setAlertPanelOpen(true)}
          className="px-4 py-1.5 rounded-md text-xs font-medium text-orange-300 border border-orange-800/50 bg-orange-950/30 hover:bg-orange-900/50 hover:shadow-[0_0_8px_rgba(249,115,22,0.3)] active:scale-95 transition-all duration-150"
        >
          🔔 Alerts
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              const result = await syncPosition(symbol);
              if (result.status === "success") {
                toast.success(`✅ Entry: ${result.entry_point}`, { theme: "dark" });
              } else {
                toast.info("ℹ️ Sin posición abierta", { theme: "dark" });
              }
            } catch (error) {
              toast.error("❌ Error sync", { theme: "dark" });
            }
          }}
          className="px-4 py-1.5 rounded-md text-xs font-medium text-teal-300 border border-teal-800/50 bg-teal-950/30 hover:bg-teal-900/50 hover:shadow-[0_0_8px_rgba(20,184,166,0.3)] active:scale-95 transition-all duration-150"
        >
          🔄 Sync
        </button>
      </form>

      <IndicatorAlertPanel isOpen={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} symbol={symbol} />

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
              <DayPicker
                mode="range"
                required
                selected={dateRange}
                onSelect={setDateRange}
              />
            </div>
            <div className="px-5 py-3 bg-[#131722] border-t border-slate-700 flex justify-between items-center">
              <span className="text-[10px] text-gray-400">
                {dateRange?.from && dateRange?.to
                  ? `${dateRange.from.toLocaleDateString()} → ${dateRange.to.toLocaleDateString()}`
                  : "Selecciona inicio y fin"}
              </span>
              <button
                onClick={() => { handleFilterSubmit(); setDateModalOpen(false); }}
                disabled={!dateRange?.from || !dateRange?.to}
                className="text-[10px] px-4 py-1.5 border border-blue-700 rounded text-white bg-blue-900/50 hover:bg-blue-800/70 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartControls;
