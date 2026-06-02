import React, { useEffect, useState } from "react";
import { fetchPaperStatus } from "../../API/APIService";

const DUMMY_DATA = {
  balance: 1247.83,
  initial_balance: 1000.0,
  total_return_pct: 24.78,
  win_rate: 61.5,
  total_trades: 13,
  open_trade: {
    symbol: "XRPUSDT",
    entry_price: "1.2680",
    take_profit: "1.3137",
    stop_loss: "1.2401",
    activated_at: "2026-06-01T14:00:00",
    probability: 0.72,
  },
  trades: [
    { created_at: "2026-05-28T09:00:00", entry_price: 1.198, exit_price: 1.241, result: "TP", return_pct: 3.44, balance_after: 1247.83 },
    { created_at: "2026-05-25T22:00:00", entry_price: 1.252, exit_price: 1.224, result: "SL", return_pct: -2.09, balance_after: 1206.38 },
    { created_at: "2026-05-23T16:00:00", entry_price: 1.185, exit_price: 1.227, result: "TP", return_pct: 3.39, balance_after: 1232.15 },
    { created_at: "2026-05-20T11:00:00", entry_price: 1.310, exit_price: 1.281, result: "SL", return_pct: -2.06, balance_after: 1191.72 },
    { created_at: "2026-05-18T03:00:00", entry_price: 1.155, exit_price: 1.196, result: "TP", return_pct: 3.40, balance_after: 1216.79 },
    { created_at: "2026-05-15T20:00:00", entry_price: 1.270, exit_price: 1.315, result: "TP", return_pct: 3.39, balance_after: 1176.76 },
    { created_at: "2026-05-13T07:00:00", entry_price: 1.302, exit_price: 1.273, result: "SL", return_pct: -2.08, balance_after: 1138.13 },
    { created_at: "2026-05-10T14:00:00", entry_price: 1.210, exit_price: 1.253, result: "TP", return_pct: 3.40, balance_after: 1162.34 },
    { created_at: "2026-05-08T01:00:00", entry_price: 1.195, exit_price: 1.237, result: "TP", return_pct: 3.37, balance_after: 1124.10 },
    { created_at: "2026-05-05T18:00:00", entry_price: 1.280, exit_price: 1.307, result: "TIMEOUT", return_pct: 1.96, balance_after: 1087.42 },
    { created_at: "2026-05-03T10:00:00", entry_price: 1.165, exit_price: 1.207, result: "TP", return_pct: 3.45, balance_after: 1066.53 },
    { created_at: "2026-04-30T22:00:00", entry_price: 1.240, exit_price: 1.213, result: "SL", return_pct: -2.33, balance_after: 1030.96 },
    { created_at: "2026-04-28T15:00:00", entry_price: 1.142, exit_price: 1.183, result: "TP", return_pct: 3.44, balance_after: 1055.58 },
  ],
};

const getResultStyle = (result) => {
  if (result === "TP" || result === "TRAIL") return "bg-green-900/50 text-green-400 border-green-700";
  if (result === "SL") return "bg-red-900/50 text-red-400 border-red-700";
  return "bg-yellow-900/50 text-yellow-400 border-yellow-700";
};

const getResultEmoji = (result) => {
  if (result === "TP") return "✅";
  if (result === "TRAIL") return "📈";
  if (result === "SL") return "❌";
  return "⏱️";
};

const PaperTradingModal = ({ isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useDummy, setUseDummy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchPaperStatus();
      if (res && res.total_trades > 0) {
        setData(res);
        setUseDummy(false);
      } else {
        setData(DUMMY_DATA);
        setUseDummy(true);
      }
    } catch (e) {
      setData(DUMMY_DATA);
      setUseDummy(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = data ? {
    avgWin: data.trades.filter(t => t.return_pct > 0).reduce((sum, t) => sum + t.return_pct, 0) / Math.max(data.trades.filter(t => t.return_pct > 0).length, 1),
    avgLoss: data.trades.filter(t => t.return_pct < 0).reduce((sum, t) => sum + t.return_pct, 0) / Math.max(data.trades.filter(t => t.return_pct < 0).length, 1),
    tpCount: data.trades.filter(t => t.result === "TP").length,
    slCount: data.trades.filter(t => t.result === "SL").length,
    timeoutCount: data.trades.filter(t => t.result === "TIMEOUT").length,
    profitFactor: (() => {
      const gains = data.trades.filter(t => t.return_pct > 0).reduce((s, t) => s + t.return_pct, 0);
      const losses = Math.abs(data.trades.filter(t => t.return_pct < 0).reduce((s, t) => s + t.return_pct, 0));
      return losses > 0 ? (gains / losses).toFixed(2) : "∞";
    })(),
    maxDrawdown: (() => {
      let peak = data.initial_balance;
      let maxDD = 0;
      for (const t of [...data.trades].reverse()) {
        if (t.balance_after > peak) peak = t.balance_after;
        const dd = (peak - t.balance_after) / peak;
        if (dd > maxDD) maxDD = dd;
      }
      return (maxDD * 100).toFixed(2);
    })(),
  } : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0b0e11] border border-slate-700 rounded-xl w-[95%] max-w-[850px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#131722] border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-lg">🤖</span>
            <div>
              <h2 className="text-sm font-semibold text-white">Paper Trading — XGBoost Mean Reversion</h2>
              <span className="text-[10px] text-gray-500">Predicción cada hora | TP +3.6% | SL -2.2% | Max Hold 48h</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {useDummy && (
              <span className="text-[9px] px-2 py-0.5 bg-yellow-900/40 border border-yellow-700 rounded text-yellow-400">DEMO</span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none px-1">✕</button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="animate-pulse text-gray-400 text-sm">Cargando datos...</div>
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Balance Principal */}
            <div className="flex items-end gap-4">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Saldo Virtual</div>
                <div className={`text-3xl font-bold ${data.balance >= data.initial_balance ? "text-green-400" : "text-red-400"}`}>
                  ${data.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`text-sm font-medium pb-1 ${data.total_return_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {data.total_return_pct >= 0 ? "▲" : "▼"} {data.total_return_pct >= 0 ? "+" : ""}{data.total_return_pct}%
              </div>
              <div className="text-[10px] text-gray-600 pb-1.5">desde ${data.initial_balance}</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="bg-[#131722] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-gray-500 uppercase">Win Rate</div>
                <div className="text-base font-bold text-white">{data.win_rate}%</div>
              </div>
              <div className="bg-[#131722] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-gray-500 uppercase">Trades</div>
                <div className="text-base font-bold text-white">{data.total_trades}</div>
              </div>
              <div className="bg-[#131722] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-gray-500 uppercase">Profit Factor</div>
                <div className="text-base font-bold text-cyan-400">{stats.profitFactor}</div>
              </div>
              <div className="bg-[#131722] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-gray-500 uppercase">Avg Win</div>
                <div className="text-base font-bold text-green-400">+{stats.avgWin.toFixed(2)}%</div>
              </div>
              <div className="bg-[#131722] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-gray-500 uppercase">Avg Loss</div>
                <div className="text-base font-bold text-red-400">{stats.avgLoss.toFixed(2)}%</div>
              </div>
              <div className="bg-[#131722] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-gray-500 uppercase">Max DD</div>
                <div className="text-base font-bold text-orange-400">{stats.maxDrawdown}%</div>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="bg-[#131722] border border-slate-800 rounded-lg p-3">
              <div className="text-[9px] text-gray-500 uppercase mb-2">Distribución de Resultados</div>
              <div className="flex rounded overflow-hidden h-4">
                <div className="bg-green-600 transition-all" style={{ width: `${(stats.tpCount / data.total_trades) * 100}%` }} />
                <div className="bg-yellow-600 transition-all" style={{ width: `${(stats.timeoutCount / data.total_trades) * 100}%` }} />
                <div className="bg-red-600 transition-all" style={{ width: `${(stats.slCount / data.total_trades) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[9px]">
                <span className="text-green-400">✅ TP: {stats.tpCount}</span>
                <span className="text-yellow-400">⏱️ Timeout: {stats.timeoutCount}</span>
                <span className="text-red-400">❌ SL: {stats.slCount}</span>
              </div>
            </div>

            {/* Open Trade */}
            {data.open_trade && (
              <div className="bg-blue-950/40 border border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-blue-300 uppercase font-semibold">🟢 Operación Activa</span>
                  <span className="text-[9px] text-blue-400">{data.open_trade.activated_at?.replace("T", " ").substring(0, 16)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-blue-900/30 rounded p-2">
                    <div className="text-[9px] text-gray-400">Entry</div>
                    <div className="text-blue-200 font-medium">${data.open_trade.entry_price}</div>
                  </div>
                  <div className="bg-green-900/30 rounded p-2">
                    <div className="text-[9px] text-gray-400">Take Profit</div>
                    <div className="text-green-400 font-medium">${data.open_trade.take_profit}</div>
                  </div>
                  <div className="bg-red-900/30 rounded p-2">
                    <div className="text-[9px] text-gray-400">Stop Loss</div>
                    <div className="text-red-400 font-medium">${data.open_trade.stop_loss}</div>
                  </div>
                  <div className="bg-yellow-900/30 rounded p-2">
                    <div className="text-[9px] text-gray-400">Confianza</div>
                    <div className="text-yellow-300 font-medium">{(data.open_trade.probability * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Trades History */}
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Historial de Operaciones</div>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-[9px] text-gray-500 uppercase bg-[#131722] border-b border-slate-800">
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-right">Entry</th>
                      <th className="px-3 py-2 text-right">Exit</th>
                      <th className="px-3 py-2 text-center">Resultado</th>
                      <th className="px-3 py-2 text-right">Retorno</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trades.map((t, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-2 text-gray-400">{t.created_at?.substring(0, 16).replace("T", " ")}</td>
                        <td className="px-3 py-2 text-right text-white">${t.entry_price}</td>
                        <td className="px-3 py-2 text-right text-white">{t.exit_price ? `$${t.exit_price}` : "—"}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium ${getResultStyle(t.result)}`}>
                            {getResultEmoji(t.result)} {t.result || "OPEN"}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${t.return_pct > 0 ? "text-green-400" : t.return_pct < 0 ? "text-red-400" : "text-gray-400"}`}>
                          {t.return_pct ? `${t.return_pct > 0 ? "+" : ""}${t.return_pct}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300">{t.balance_after ? `$${t.balance_after.toFixed(2)}` : "—"}</td>
                      </tr>
                    ))}
                    {data.trades.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-600">Esperando señales del modelo...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#131722] border-t border-slate-700 flex justify-between items-center">
          <span className="text-[9px] text-gray-600">
            {useDummy ? "⚠️ Datos de demostración — esperando trades reales" : `Última actualización: ${new Date().toLocaleTimeString()}`}
          </span>
          <button
            onClick={loadData}
            className="text-[10px] px-3 py-1 border border-cyan-700 rounded text-cyan-400 hover:bg-cyan-900/30 transition"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaperTradingModal;
