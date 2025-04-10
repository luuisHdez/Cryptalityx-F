import React, { useState } from "react";
import { updateBinanceData, fetchHistoricalData, submitOperationConfig } from "../../API/APIService";
import {ToastContainer, toast } from 'react-toastify'

const TOOL_COLORS = {
  stop_loss: "bg-red-500",
  take_profit: "bg-green-500",
  entry_point: "bg-blue-500",
  take_benefit: "bg-blue-300",
  alert_up: "bg-orange-500",
  alert_down: "bg-purple-500",
};

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
    crypto: "",
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
        filters.crypto
      );
      console.log("✅ Datos actualizados:", result);
  
      // Si el update fue exitoso y hay cripto + intervalos válidos, recarga gráfica
      if (filters.crypto && interval) {
        const updatedData = await fetchHistoricalData(filters.crypto, interval);
        setCandles(updatedData);
        setSymbol(filters.crypto); // opcional: sincroniza visualmente
      }
    } catch (error) {
      console.error("❌ Error en la petición:", error);
    }
  };


  return (
    <div className="flex flex-col gap-2 text-xs px-2 mt-1 mb-1">
      {/* Selects y switches */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={symbol}
          onChange={handleSymbolChange}
          className="min-w-[90px] bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
        >
          <option value="xrpusdt">XRP/USDT</option>
          <option value="btcusdt">BTC/USDT</option>
          <option value="ethusdt">ETH/USDT</option>
        </select>

        <select
          value={interval}
          onChange={handleIntervalChange}
          className="min-w-[70px] bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
        >
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="1d">1d</option>
        </select>

        <div className="flex items-center space-x-1">
          <label className="text-white">Activar EPt, AU y AD</label>
          <button
            onClick={() =>
              setToolStates(prev => ({
                ...prev,
                activeOperation: !prev.activeOperation,
              }))
            }
            className={`w-8 h-4 flex items-center rounded-full p-0.5 ${
              toolStates.activeOperation ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            <div
              className={`w-3 h-3 bg-white rounded-full transform transition ${
                toolStates.activeOperation ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mini formulario de filtros */}
      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="date"
          name="start_date"
          value={filters.start_date}
          onChange={handleFilterChange}
          className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
        />
        <input
          type="date"
          name="end_date"
          value={filters.end_date}
          onChange={handleFilterChange}
          className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
        />
        <select
          name="crypto"
          value={filters.crypto}
          onChange={handleFilterChange}
          className="min-w-[90px] bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
        >
          <option value="">Cripto</option>
          <option value="xrpusdt">XRP/USDT</option>
          <option value="btcusdt">BTC/USDT</option>
          <option value="ethusdt">ETH/USDT</option>
        </select>

        <button
          type="submit"
          className="min-w-[90px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
        >
          Aplicar
        </button>
        <button
  type="button"
  className="min-w-[90px] bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition"
  onClick={async () => {
    try {
      if (!toolStates.activeOperation) {
        toast.error("⚠️ Activa la operación antes de enviar.", {
          theme: "dark",
        });
        return;
      }
  
      const values = {
        EPt: toolStates.EPt?.value,
        AU: toolStates.AU?.value,
        AD: toolStates.AD?.value,
      };
  
      // Validación: no vacíos y con 4 decimales
      for (const [key, val] of Object.entries(values)) {
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
  
        values[key] = { value: stringVal };
      }
  
      const result = await submitOperationConfig(symbol, values);
      toast.success("✅ Config enviada correctamente", {
        theme: "dark",
      });
      console.log("✅ Config enviada:", result);
  
      setToolStates(prev => ({
        ...prev,
        TK: { ...prev.TK, value: 0, visible: false },
        SL: { ...prev.SL, value: 0, visible: false },
        TB: { ...prev.TB, value: 0, visible: false },
      }));
    } catch (error) {
      toast.error("❌ Fallo al enviar configuración.", {
        theme: "dark",
      });
      console.error("❌ Error:", error);
    }
  }}
>
  Enviar Config
</button>
      </form>
    </div>
  );
};

export default ChartControls;
