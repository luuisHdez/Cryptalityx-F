import React, { useState, useEffect } from "react";
import { fetchOrderHistory } from "../../API/APIService";

const TableResults = ({ symbol }) => {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState("1d");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadOrders = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const data = await fetchOrderHistory(symbol, period);
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [symbol, period]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  // Filter orders by custom date range if set
  const filteredOrders = (startDate || endDate)
    ? orders.filter((order) => {
        const t = order.time;
        if (startDate && t < new Date(startDate).getTime()) return false;
        if (endDate && t > new Date(endDate).getTime() + 86400000) return false;
        return true;
      })
    : orders;

  const periods = [
    { label: "1 Día", value: "1d" },
    { label: "Semana", value: "1w" },
    { label: "Mes", value: "1m" },
    { label: "3 Meses", value: "3m" },
  ];

  return (
    <div className="w-full">
      {/* Controls row */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {/* Period tabs */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => { setPeriod(p.value); setStartDate(""); setEndDate(""); }}
              className={`text-xs px-2 py-0.5 rounded transition ${
                period === p.value && !startDate
                  ? "text-white bg-blue-900/50 border border-blue-700"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-900 text-gray-300 border border-gray-700 rounded px-1.5 py-0.5 text-[10px]"
          />
          <span className="text-gray-500 text-[10px]">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-900 text-gray-300 border border-gray-700 rounded px-1.5 py-0.5 text-[10px]"
          />
          <button
            onClick={loadOrders}
            disabled={!startDate && !endDate}
            className="px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-800/50 bg-blue-950/30 hover:bg-blue-900/50 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-gray-800 rounded">
        <table className="w-full text-[11px] text-left">
          <thead className="sticky top-0 bg-[#181A20] z-10">
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="py-1.5 px-2 font-normal">Fecha</th>
              <th className="py-1.5 px-2 font-normal">Par</th>
              <th className="py-1.5 px-2 font-normal">Tipo</th>
              <th className="py-1.5 px-2 font-normal">Orden</th>
              <th className="py-1.5 px-2 font-normal">Precio</th>
              <th className="py-1.5 px-2 font-normal">Ejecutado</th>
              <th className="py-1.5 px-2 font-normal">Monto</th>
              <th className="py-1.5 px-2 font-normal">Total</th>
              <th className="py-1.5 px-2 font-normal">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center py-4 text-gray-500">Cargando...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-4 text-gray-500">Sin órdenes</td></tr>
            ) : (
              filteredOrders.map((order, i) => (
                <tr key={order.order_id || i} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                  <td className="py-1.5 px-2 text-gray-300">{formatDate(order.time)}</td>
                  <td className="py-1.5 px-2 text-white">{order.symbol?.replace("USDT", "/USDT")}</td>
                  <td className="py-1.5 px-2 text-gray-300">{order.type}</td>
                  <td className={`py-1.5 px-2 ${order.side === "BUY" ? "text-[#2ecc71]" : "text-[#e74c3c]"}`}>
                    {order.side === "BUY" ? "Comprar" : "Vender"}
                  </td>
                  <td className="py-1.5 px-2 text-gray-300">{order.price}</td>
                  <td className="py-1.5 px-2 text-gray-300">{order.executed_qty}</td>
                  <td className="py-1.5 px-2 text-gray-300">{order.orig_qty}</td>
                  <td className="py-1.5 px-2 text-gray-300">{order.total}</td>
                  <td className={`py-1.5 px-2 ${order.status === "FILLED" ? "text-[#2ecc71]" : order.status === "CANCELED" ? "text-gray-500" : "text-yellow-400"}`}>
                    {order.status === "FILLED" ? "Completado" : order.status === "CANCELED" ? "Cancelado" : order.status === "NEW" ? "Abierta" : order.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableResults;
