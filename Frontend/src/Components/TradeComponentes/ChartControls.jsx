import React, { useState } from "react";
import {
  updateBinanceData, fetchHistoricalData,
  submitOperationConfig, stopOperation, buyOrder,
  sellOrder
} from "../../API/APIService";
import { toast } from 'react-toastify'

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

  const handleSymbolChange = (e) => {
    setCandles([]);
    setSymbol(e.target.value);
  };

  const handleIntervalChange = (e) => {
    setCandles([]);
    setInterval(e.target.value);
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
    e.preventDefault();
    try {
      const result = await updateBinanceData(
        filters.start_date,
        filters.end_date,
        symbol
      );
      console.log("✅ Datos actualizados:", result);

      // Si el update fue exitoso y hay cripto + intervalos válidos, recarga gráfica
      if (symbol && interval) {
        const updatedData = await fetchHistoricalData(symbol, interval);
        setCandles(updatedData);
        setSymbol(symbol); // opcional: sincroniza visualmente
      }
    } catch (error) {
      console.error("❌ Error en la petición:", error);
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
          onChange={handleIntervalChange}
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
        className="flex flex-wrap items-center gap-1"
      >
        <input
          type="date"
          name="start_date"
          value={filters.start_date}
          onChange={handleFilterChange}
          className="bg-gray-800 text-white border border-blue-700 rounded px-1 py-0.5"
        />
        <input
          type="date"
          name="end_date"
          value={filters.end_date}
          onChange={handleFilterChange}
          className="bg-gray-800 text-white border border-blue-700 rounded px-1 py-0.5"
        />
        <button
          type="submit"
          className="relative min-w-[90px] overflow-hidden rounded-lg border border-blue-700 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#1e3a8a] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-500 to-blue-900 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          <span className="relative z-10">Apply</span>
        </button>


        <button
          type="button"
          onClick={async () => {
            try {
              if (!toolStates.active_alerts) {
                toast.error("⚠️ Activa la operación antes de enviar.", {
                  theme: "dark",
                });
                return;
              }
              const values = {
                alert_up: toolStates.alert_up?.value,
                alert_down: toolStates.alert_down?.value,
                active_alerts: !!toolStates.active_alerts,
                active_operations: !!toolStates.active_operations,
              };

              for (const key of ["alert_up", "alert_down"]) {
                const val = values[key];
                if (val === undefined || val === null || val === "") {
                  toast.error(`❌ ${key} está vacío`, {
                    theme: "dark",
                  });
                  return;
                }

                const stringVal = Number(val).toFixed(4);
                if (!/^\d+\.\d{4}$/.test(stringVal)) {
                  toast.error(`❌ ${key} debe tener exactamente 4 decimales`, {
                    theme: "dark",
                  });
                  return;
                }

                values[key] = stringVal;
              }

              const result = await submitOperationConfig(symbol, values);
              console.log(symbol, values);
              toast.success("✅ Config enviada correctamente", {
                theme: "dark",
              });
            } catch (error) {
              toast.error("❌ Fallo al enviar configuración.", {
                theme: "dark",
              });
              console.error("❌ Error:", error);
            }
          }}
          className="relative min-w-[90px] overflow-hidden rounded-lg border border-yellow-700 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#a16207] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-yellow-500 to-yellow-900 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          <span className="relative z-10">SendConfig</span>
        </button>


        <button
          type="button"
          onClick={async () => {
            try {
              const result = await stopOperation(symbol);
              toast.success("🛑 Operación detenida exitosamente", { theme: "dark" });
              console.log("🛑 Resultado stopOperation:", result);
            } catch (error) {
              toast.error("❌ Error al detener la operación", { theme: "dark" });
            }
          }}
          className="relative min-w-[90px] overflow-hidden rounded-lg border border-red-700 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#991b1b] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-red-500 to-red-900 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          <span className="relative z-10">Stop Operations</span>
        </button>




        <button
          type="button"
          onClick={async () => {
            try {
              console.log("🟢 Ejecutando orden de compra para", symbol);
              const result = await buyOrder(symbol, toolStates.active_operations, toolStates.active_alerts);
              toast.success("✅ Orden de compra ejecutada", { theme: "dark" });
              console.log("🟢 Resultado buyOrder:", result);
            } catch (error) {
              toast.error("❌ Error al ejecutar orden de compra", { theme: "dark" });
              console.error("❌ Error:", error);
            }
          }}
          className="relative overflow-hidden rounded-lg border border-green-600 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#15803d] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-green-500 to-green-900 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          <span className="relative z-10">Buy</span>
        </button>



        <button
          type="button"
          onClick={async () => {
            try {
              console.log("funcion ejecutando", symbol);
              const result = await sellOrder(symbol, toolStates.active_operations, toolStates.active_alerts); // 🔴 Llama a la API
              toast.success("✅ Orden de venta ejecutada", { theme: "dark" });
              console.log("🔴 Resultado sellOrder:", result);
            } catch (error) {
              toast.error("❌ Error al ejecutar orden de venta", { theme: "dark" });
            }
          }}
          className="relative overflow-hidden rounded-lg border border-purple-600 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#6b21a8] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-purple-500 to-purple-900 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          <span className="relative z-10">Vender</span>
        </button>
      </form>
    </div>
  );
};

export default ChartControls;
