import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  openFuturesPosition,
  closeFuturesPosition,
  fetchFuturesSymbolInfo,
} from "../../API/APIService";
import { useAccount } from "../../contexts/AccountContext";
import {
  computeAmountFromSlider,
  computeEstimates,
} from "./futuresCalculations";

// Panel de trading de FUTUROS USDT-M (réplica del layout de Binance).
// Fase actual: funcional para Market LONG/SHORT, apalancamiento y modo de margen
// configurables, monto USDT + slider, estimados y cierre de posición.
// Controles de fases posteriores (Limit/Condicional, TP/SL, Reduce-Only, TIF,
// BBO, botón "S") se muestran para replicar el layout pero quedan inactivos.
const TradingPanel = ({ symbol }) => {
  const { usdtAvailable, position } = useAccount();

  const [marginMode, setMarginMode] = useState("CROSSED"); // CROSSED | ISOLATED
  const [leverage, setLeverage] = useState(20);
  const [maxLeverage, setMaxLeverage] = useState(125); // máximo real del símbolo
  const [orderType, setOrderType] = useState("MARKET"); // pestaña activa
  const [amount, setAmount] = useState("");
  const [slider, setSlider] = useState(0);
  const [loading, setLoading] = useState(false);

  const asset = symbol ? symbol.toUpperCase().replace("USDT", "") : "";

  // Al cambiar de símbolo: reset del monto y carga del máximo de apalancamiento
  // real (leverageBracket de Binance) para limitar el input.
  useEffect(() => {
    setAmount("");
    setSlider(0);
    let active = true;
    if (symbol) {
      fetchFuturesSymbolInfo(symbol).then((info) => {
        if (active && info && info.max_leverage) {
          const max = Number(info.max_leverage);
          setMaxLeverage(max);
          // Ajusta el apalancamiento actual si excede el nuevo máximo.
          setLeverage((lev) => Math.min(lev, max));
        }
      });
    }
    return () => {
      active = false;
    };
  }, [symbol]);

  const clampLeverage = (val) => Math.min(Math.max(1, val), maxLeverage);

  const amountNum = parseFloat(amount) || 0;
  const estimates = computeEstimates(amountNum, usdtAvailable, leverage);

  // --- Sincronización monto <-> slider ---
  const handleSlider = (e) => {
    const pct = Number(e.target.value);
    setSlider(pct);
    setAmount(computeAmountFromSlider(pct, usdtAvailable).toFixed(2));
  };

  const handleAmountInput = (e) => {
    const val = e.target.value;
    setAmount(val);
    if (usdtAvailable > 0) {
      const pct = Math.min(100, Math.max(0, (parseFloat(val || 0) / usdtAvailable) * 100));
      setSlider(Math.round(pct));
    }
  };

  const setPctMark = (mark) => {
    setSlider(mark);
    setAmount(computeAmountFromSlider(mark, usdtAvailable).toFixed(2));
  };

  // --- Validación de habilitación de botones ---
  const disabledReason =
    usdtAvailable <= 0
      ? "Sin saldo disponible"
      : amountNum <= 0
      ? "Ingresa un monto"
      : amountNum > usdtAvailable
      ? "Monto excede el disponible"
      : null;
  const canTrade = !disabledReason && !loading;

  // --- Apertura de posición ---
  const openPosition = async (side) => {
    if (!canTrade) {
      if (disabledReason) toast.error(`⚠️ ${disabledReason}`, { theme: "dark" });
      return;
    }
    setLoading(true);
    try {
      await openFuturesPosition(symbol, side, amountNum, leverage, marginMode);
      toast.success(
        `✅ Posición ${side === "LONG" ? "LONG" : "SHORT"} abierta`,
        { theme: "dark" }
      );
      setAmount("");
      setSlider(0);
    } catch (error) {
      toast.error(`❌ ${error.message}`, { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  // --- Cierre de posición ---
  const closePosition = async () => {
    setLoading(true);
    try {
      await closeFuturesPosition(symbol);
      toast.success("✅ Posición cerrada", { theme: "dark" });
    } catch (error) {
      toast.error(`❌ ${error.message}`, { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  const marginLabel = marginMode === "CROSSED" ? "Cruzado" : "Aislado";

  return (
    <div className="w-full bg-[#181A20] border border-blue-900 p-3 text-xs">
      {/* 1. Fila de configuración: margen | apalancamiento | S */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setMarginMode((m) => (m === "CROSSED" ? "ISOLATED" : "CROSSED"))}
          className="px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
        >
          {marginLabel}
        </button>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max={maxLeverage}
            value={leverage}
            onChange={(e) => setLeverage(clampLeverage(parseInt(e.target.value || "1", 10)))}
            className="w-14 px-2 py-1 rounded bg-gray-900 text-white border border-gray-700 text-center"
          />
          <span className="text-gray-400">x</span>
          <span className="text-[10px] text-gray-500">máx {maxLeverage}x</span>
        </div>
        {/* Botón "S" (modo de posición) — visual, inactivo en esta fase */}
        <button
          disabled
          title="Modo de posición (próximamente)"
          className="px-2 py-1 rounded bg-gray-800/50 text-gray-500 border border-gray-800 cursor-not-allowed"
        >
          S
        </button>
      </div>

      {/* 2. Pestañas de tipo de orden */}
      <div className="flex items-center gap-3 border-b border-gray-700 mb-2">
        {[
          { key: "LIMIT", label: "Limit", active: false },
          { key: "MARKET", label: "Mercado", active: true },
          { key: "CONDITIONAL", label: "Condicional", active: false },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => tab.active && setOrderType(tab.key)}
            disabled={!tab.active}
            className={`pb-1 ${
              orderType === tab.key && tab.active
                ? "text-yellow-400 border-b-2 border-yellow-400 font-semibold"
                : tab.active
                ? "text-gray-300 hover:text-white"
                : "text-gray-600 cursor-not-allowed"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Disponible */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400">Disp.</span>
        <span className="text-white font-semibold">
          {Number(usdtAvailable || 0).toFixed(2)} USDT
        </span>
      </div>

      {/* 4. Precio (solo Limit) — inactivo en Mercado */}
      <div className="mb-2 opacity-50">
        <label className="text-gray-500">Precio</label>
        <div className="flex items-center rounded bg-gray-900 border border-gray-800 px-2">
          <input
            type="text"
            disabled
            placeholder="Precio de mercado"
            className="w-full bg-transparent py-1.5 text-gray-500 outline-none"
          />
          <span className="text-gray-500 text-[10px]">USDT</span>
        </div>
      </div>

      {/* 5. Monto */}
      <div className="mb-2">
        <label className="text-gray-400">Monto</label>
        <div className="flex items-center rounded bg-gray-900 border border-blue-800 px-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={handleAmountInput}
            placeholder="0.00"
            className="w-full bg-transparent py-1.5 text-white outline-none"
          />
          <span className="text-gray-300 text-[10px]">USDT</span>
        </div>
      </div>

      {/* 6. Slider */}
      <div className="relative pt-1 mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={slider}
          onChange={handleSlider}
          className="w-full"
        />
        <div className="flex justify-between px-0.5 mt-0.5">
          {[0, 25, 50, 75, 100].map((mark) => (
            <span
              key={mark}
              onClick={() => setPctMark(mark)}
              className={`w-2 h-2 rounded-full cursor-pointer ${
                slider >= mark ? "bg-yellow-500" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 7. TP/SL — visual, inactivo en esta fase */}
      <div className="mb-2 opacity-50">
        <div className="flex items-center gap-2">
          <input type="checkbox" disabled />
          <span className="text-gray-500">TP/SL</span>
          <button disabled className="ml-auto text-gray-600 cursor-not-allowed text-[10px]">
            Avanzado
          </button>
        </div>
      </div>

      {/* 8. Reduce-Only + TIF — visual, inactivo en esta fase */}
      <div className="flex items-center justify-between mb-3 opacity-50">
        <label className="flex items-center gap-2 text-gray-500">
          <input type="checkbox" disabled /> Reduce-Only
        </label>
        <span className="text-gray-500 text-[10px]">TIF: GTC</span>
      </div>

      {/* 9. Botones Long / Short */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => openPosition("LONG")}
          disabled={!canTrade}
          className="py-2 text-sm font-bold rounded bg-[#2ecc71] hover:bg-[#27ae60] text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Comprar/Long
        </button>
        <button
          onClick={() => openPosition("SHORT")}
          disabled={!canTrade}
          className="py-2 text-sm font-bold rounded bg-[#e74c3c] hover:bg-[#c0392b] text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Vender/Short
        </button>
      </div>

      {/* 10. Estimados en dos columnas (Long / Short) */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 mb-2">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Costo</span>
            <span className="text-white">{estimates.costRounded.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between">
            <span>Máx</span>
            <span className="text-white">{estimates.maxNotionalRounded.toFixed(2)} USDT</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Costo</span>
            <span className="text-white">{estimates.costRounded.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between">
            <span>Máx</span>
            <span className="text-white">{estimates.maxNotionalRounded.toFixed(2)} USDT</span>
          </div>
        </div>
      </div>

      {/* Cerrar posición — solo si hay posición abierta */}
      {position && (
        <button
          onClick={closePosition}
          disabled={loading}
          className="w-full py-2 text-sm font-semibold rounded bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-50"
        >
          Cerrar posición {position.symbol} ({position.side})
        </button>
      )}
    </div>
  );
};

export default TradingPanel;
