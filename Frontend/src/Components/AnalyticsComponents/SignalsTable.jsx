import { OUTCOMES, formatMsDisplay, formatNumber, formatDuration, isLong } from "./analyticsFormat";

// Tabla de señales de la corrida. Cada fila es un botón: al elegirla se resalta
// y la gráfica se centra en su vela.
// TP y SL con el signo de la dirección: short gana bajando (−TP / +SL), long subiendo (+TP / −SL).
const barrierText = (s, model) => {
  if (s.tp_pct == null) return "—";
  const tp = formatNumber(s.tp_pct * 100, 2);
  const sl = formatNumber(s.sl_pct * 100, 2);
  return isLong(model) ? `+${tp}% / −${sl}%` : `−${tp}% / +${sl}%`;
};

const SignalsTable = ({ signals, selectedTs, onSelect, barMinutes, model }) => (
  <section aria-labelledby="signals-title" className="bg-[#161a20] border border-[#2b3139] rounded-md">
    <h3 id="signals-title" className="px-3 pt-3 pb-2 text-[11px] tracking-wider text-[#848e9c] uppercase">
      Señales ({signals.length}) · hora UTC-6
    </h3>
    <div className="max-h-[320px] overflow-y-auto no-scrollbar">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#161a20] text-[#5e6673]">
          <tr>
            <th scope="col" className="text-left font-normal px-3 py-1.5">Fecha</th>
            <th scope="col" className="text-right font-normal px-2 py-1.5">Precio</th>
            <th scope="col" className="text-right font-normal px-2 py-1.5">Prob</th>
            <th scope="col" className="text-right font-normal px-2 py-1.5">RSI</th>
            <th scope="col" className="text-right font-normal px-2 py-1.5">TP / SL</th>
            <th scope="col" className="text-left font-normal px-2 py-1.5">Resultado</th>
            <th scope="col" className="text-right font-normal px-3 py-1.5">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {signals.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-4 text-center text-[#848e9c]">
                Esta corrida no generó señales.
              </td>
            </tr>
          )}
          {signals.map((s) => {
            const outcome = OUTCOMES[s.outcome] || OUTCOMES.timeout;
            const selected = s.ts === selectedTs;
            return (
              <tr
                key={s.ts}
                className={`border-t border-[#2b3139] ${selected ? "bg-[#1e2a3a]" : "hover:bg-[#1b2028]"}`}
              >
                <td className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => onSelect(s.ts)}
                    aria-pressed={selected}
                    className="text-[#eaecef] hover:underline focus:outline-none focus:underline"
                  >
                    {formatMsDisplay(s.ts)}
                  </button>
                </td>
                <td className="px-2 py-1.5 text-right text-[#eaecef]">{formatNumber(s.price, 4)}</td>
                <td className="px-2 py-1.5 text-right text-[#eaecef]">{formatNumber(s.prob * 100, 1)}%</td>
                <td className="px-2 py-1.5 text-right text-[#eaecef]">{formatNumber(s.rsi, 1)}</td>
                <td className="px-2 py-1.5 text-right text-[#848e9c] whitespace-nowrap">
                  {barrierText(s, model)}
                </td>
                <td className={`px-2 py-1.5 ${outcome.text}`}>{outcome.label}</td>
                <td className="px-3 py-1.5 text-right text-[#848e9c]">
                  {s.bars_to_outcome == null ? "—" : formatDuration(s.bars_to_outcome * barMinutes)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

export default SignalsTable;
