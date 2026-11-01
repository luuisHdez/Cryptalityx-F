import React, { useState } from "react";
import { submitIndicatorAlertConfig } from "../../API/APIService";
import { toast } from "react-toastify";

const IndicatorAlertPanel = ({ isOpen, onClose, symbol }) => {
  const [alertInterval, setAlertInterval] = useState("1h");
  const [rsiEnabled, setRsiEnabled] = useState(false);
  const [rsiThreshold, setRsiThreshold] = useState(30);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [bbLowerEnabled, setBbLowerEnabled] = useState(false);
  const [ema50Enabled, setEma50Enabled] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const config = {
      alert_interval: alertInterval,
      indicator_alerts: {
        rsi: {
          enabled: rsiEnabled,
          threshold: rsiThreshold,
          direction: "below",
          period: rsiPeriod,
        },
        bb_lower: {
          enabled: bbLowerEnabled,
        },
        ema50_cross: {
          enabled: ema50Enabled,
        },
      },
    };

    try {
      await submitIndicatorAlertConfig(symbol, config);
      toast.success("✅ Alertas configuradas", { theme: "dark" });
    } catch (error) {
      toast.error("❌ Error al configurar alertas", { theme: "dark" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0e11] border border-slate-700 rounded-xl w-[95%] max-w-[450px] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#131722] border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">
            Configurar Alertas de Indicadores
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Interval selector */}
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
              Intervalo de Alertas
            </label>
            <select
              value={alertInterval}
              onChange={(e) => setAlertInterval(e.target.value)}
              className="w-full bg-gray-800 text-white border border-blue-700 rounded px-3 py-1.5 text-xs"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="2h">2h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>

          {/* RSI Section */}
          <div className="bg-[#131722] border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">RSI</span>
              <button
                onClick={() => setRsiEnabled(!rsiEnabled)}
                className={`w-8 h-4 flex items-center rounded-full p-0.5 ${
                  rsiEnabled ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transform transition ${
                    rsiEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {rsiEnabled && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-400">Umbral:</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={rsiThreshold}
                    onChange={(e) => setRsiThreshold(Number(e.target.value))}
                    className="w-16 bg-gray-800 text-white border border-blue-700 rounded px-2 py-0.5 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-400">Periodo:</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={rsiPeriod}
                    onChange={(e) => setRsiPeriod(Number(e.target.value))}
                    className="w-16 bg-gray-800 text-white border border-blue-700 rounded px-2 py-0.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bollinger Lower Section */}
          <div className="bg-[#131722] border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">
                Bollinger Lower
              </span>
              <button
                onClick={() => setBbLowerEnabled(!bbLowerEnabled)}
                className={`w-8 h-4 flex items-center rounded-full p-0.5 ${
                  bbLowerEnabled ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transform transition ${
                    bbLowerEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* EMA50 Cross Section */}
          <div className="bg-[#131722] border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">EMA50 Cross</span>
              <button
                onClick={() => setEma50Enabled(!ema50Enabled)}
                className={`w-8 h-4 flex items-center rounded-full p-0.5 ${
                  ema50Enabled ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transform transition ${
                    ema50Enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#131722] border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[10px] px-4 py-1.5 border border-slate-600 rounded text-gray-400 hover:text-white hover:border-slate-400 transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleSubmit}
            className="text-[10px] px-4 py-1.5 border border-blue-700 rounded text-white bg-blue-900/50 hover:bg-blue-800/70 transition font-semibold"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndicatorAlertPanel;
