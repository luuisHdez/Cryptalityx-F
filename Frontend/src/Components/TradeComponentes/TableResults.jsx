import React, { useEffect, useState } from "react";
import { fetchOperationResults } from "../../API/APIService";
import { toast } from "react-toastify";

// Formato visual para tipo de operación
const getOperationStyle = (type) => {
  const base = "px-2 py-0.5 text-xs font-semibold rounded ";
  if (type === "EP") return base + "bg-green-800 text-green-100";
  if (type === "CO") return base + "bg-red-800 text-red-100";
  return base + "bg-slate-600 text-white";
};

const TableResults = ({ symbol }) => {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(5);

  const loadResults = async () => {
    try {
      const data = await fetchOperationResults(symbol);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error al cargar resultados:", error.message);
      toast.error("❌ Error al cargar resultados");
    }
  };

  useEffect(() => {
    if (symbol) loadResults();
  }, [symbol]);

  const paginated = results.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.max(1, Math.ceil(results.length / perPage));

  if (!symbol) return null;

  return (
    <div className="w-full bg-neutral-900 border border-slate-700 shadow-sm overflow-x-auto text-white text-xs mt-2">
      {/* Header de controles */}
      <div className="flex flex-wrap items-center justify-between px-2 py-1 gap-2 bg-neutral-800 border-b border-slate-700">
        <label className="text-xs text-gray-400">
          Mostrar{" "}
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(0);
            }}
            className="bg-neutral-800 border border-gray-600 text-white px-1 py-0.5 text-xs rounded ml-2"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>{" "}
          registros
        </label>

        <button
          onClick={loadResults}
          className="ml-auto px-2 py-0.5 text-xs border border-blue-500 rounded text-blue-400 hover:bg-blue-800 transition"
        >
          ↻ Recargar
        </button>

        <div className="text-xs text-gray-400">
          Página {page + 1} de {totalPages}
        </div>
      </div>

      {/* Tabla centrada horizontalmente (columnas, no contenedor) */}
      <div className="overflow-y-auto h-[180px]">
        <table className="min-w-[600px] w-full table-fixed mx-auto text-center text-[10px]">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-700">
              <th className="w-[12%] px-2 py-1">Fecha</th>
              <th className="w-[8%] px-2 py-1">Tipo</th>
              <th className="w-[14%] px-2 py-1">Precio</th>
              <th className="w-[14%] px-2 py-1">Cantidad</th>
              <th className="w-[14%] px-2 py-1">Total</th>
              <th className="w-[14%] px-2 py-1">Comisión</th>
              <th className="w-[24%] px-2 py-1">Activo</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((op, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-neutral-800" : "bg-neutral-900"}
              >
                <td className="px-2 py-1">
                  {op.executed_at ? op.executed_at.replace("T", " ").substring(0, 16) : op.closed_at?.replace("T", " ").substring(0, 16)}

                </td>
                <td className="px-2 py-1">
                  <span className={getOperationStyle(op.operation)}>
                    {op.operation}
                  </span>
                </td>
                <td className="px-2 py-1">{op.price_avg || op.exit_price}</td>
                <td className="px-2 py-1">{op.amount || op.binance?.executedQty}</td>
                <td className="px-2 py-1">{op.total_usdt || op.binance?.cummulativeQuoteQty}</td>
                <td className="px-2 py-1">
                  {op.commission} {op.commission_asset}
                </td>
                <td className="px-2 py-1">{symbol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer paginación */}
      <div className="flex justify-between items-center px-2 py-1 bg-neutral-800 border-t border-slate-700">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="text-[10px] px-2 py-1 border border-slate-600 rounded disabled:opacity-50"
        >
          ◀ Anterior
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="text-[10px] px-2 py-1 border border-slate-600 rounded disabled:opacity-50"
        >
          Siguiente ▶
        </button>
      </div>
    </div>
  );
};

export default TableResults;
