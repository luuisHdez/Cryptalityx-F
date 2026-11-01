import React from "react";
import { useAccount } from "../../contexts/AccountContext";

// Muestra la posición abierta de Futuros al estilo Binance.
// Lee del AccountContext (fuente única alimentada por el stream del backend).
// Si no hay posición abierta, no renderiza nada (el div desaparece).
const PositionPanel = () => {
  const { position } = useAccount();

  // Sin posición abierta → no se muestra el div.
  if (!position) return null;

  const isLong = position.side === "LONG";
  const pnl = Number(position.unrealized_pnl || 0);
  const roi = Number(position.roi_pct || 0);
  const pnlColor = pnl >= 0 ? "text-[#2ecc71]" : "text-[#e74c3c]";

  const Field = ({ label, value, className = "text-white" }) => (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className={`font-semibold ${className}`}>{value}</p>
    </div>
  );

  return (
    <div className="w-full bg-[#181A20] border border-blue-900 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-[3px] h-[16px] rounded ${
              isLong ? "bg-[#2ecc71]" : "bg-[#e74c3c]"
            }`}
          />
          <span className="text-xs font-semibold text-white">
            {position.symbol}
          </span>
          <span className="text-[10px] text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">
            Perp.
          </span>
          {position.leverage != null && (
            <span className="text-[10px] text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">
              {position.leverage}x
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
            isLong ? "bg-green-900/40 text-[#2ecc71]" : "bg-red-900/40 text-[#e74c3c]"
          }`}
        >
          {position.side}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        <Field
          label="Tamaño"
          value={`${Number(position.size_usdt).toFixed(2)} USDT`}
          className={isLong ? "text-[#2ecc71]" : "text-[#e74c3c]"}
        />
        <Field
          label="Precio de entrada"
          value={Number(position.entry_price).toFixed(7)}
        />
        <Field
          label="Precio de equilibrio"
          value={Number(position.break_even_price).toFixed(7)}
        />
        <Field
          label="Precio de marca"
          value={Number(position.mark_price).toFixed(7)}
        />
        <Field
          label="Precio de Liq."
          value={Number(position.liquidation_price).toFixed(7)}
          className="text-[#f39c12]"
        />
        <Field
          label="Margen"
          value={`${Number(position.margin).toFixed(2)} USDT (${position.margin_type})`}
        />
        <div>
          <p className="text-gray-400">PnL (%ROI)</p>
          <p className={`font-semibold ${pnlColor}`}>
            {pnl >= 0 ? "+" : ""}
            {pnl.toFixed(2)} USDT
          </p>
          <p className={`text-[10px] ${pnlColor}`}>
            {roi >= 0 ? "+" : ""}
            {roi.toFixed(2)}%
          </p>
        </div>
        <Field
          label="Tamaño (contratos)"
          value={Number(position.size_contracts).toFixed(4)}
        />
      </div>
    </div>
  );
};

export default PositionPanel;
