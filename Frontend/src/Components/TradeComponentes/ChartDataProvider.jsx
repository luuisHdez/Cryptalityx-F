import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchHistoricalData, fetchUpdatedData } from "../../API/APIService";
import ChartControls from "./ChartControls";
import CandleChart from "./CandleChart";
import ToolInput from "./ToolInput";
import { useLocation } from "react-router-dom";
import { RingLoader } from "react-spinners";
import MarkTicket from "./MarkTicket";
import TableResults from "./TableResults";
import {
  subscribeToSymbol,
  listenToData,
  stopListening,
  listeningOperationActivated,
} from "../../API/trade_api";
import { useSocket } from "../../contexts/SocketContext"; // para acceder al socket
const INITIAL_TOOL_STATES = {
  active_alerts: false,
  active_operations: false,
  stop_loss: { visible: false, value: "" },
  take_profit: { visible: false, value: "" },
  entry_point: { visible: false, value: "" },
  take_benefit: { visible: false, value: "" },
  alert_up: { visible: false, value: "" },
  alert_down: { visible: false, value: "" },
};

const ChartDataProvider = ({ symbol, interval, setSymbol, setInterval, operationConfig }) => {
  const [candles, setCandles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [toolStates, setToolStates] = useState(INITIAL_TOOL_STATES);
  const location = useLocation();
  const [currentPrice, setCurrentPrice] = useState(null);
  const hasReset = useRef(false);

 

  const { socket } = useSocket();
  useEffect(() => {
    if (!symbol || !interval) return;

    let isMounted = true;
    setLoading(true);
    setHasFetched(false);

    const loadAndUpdate = async () => {
      try {
        const updated = await fetchUpdatedData(symbol, interval);
        if (!isMounted) return;
        setCandles(updated || []);
        setHasFetched(true);
      } catch (err) {
        console.error("❌ Error al cargar datos actualizados", err);
        setCandles([]);
        setError("Error al cargar datos.");
        setHasFetched(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };


    loadAndUpdate();
    return () => {
      isMounted = false;
    };
  }, [symbol, interval]);


  //----------------
  const handleSocketData = useCallback((message) => {

    // Actualización de velas
    if (message?.e === "kline" && message.s === symbol.toUpperCase()) {
      const k = message.k;
      const utcDate = new Date(k.t);
      const offsetMs = 6 * 60 * 60 * 1000; // UTC-6
      const localDate = new Date(utcDate.getTime() - offsetMs);
      const adjustedTime = Math.floor(localDate.getTime() / 1000);

      const formatted = {
        time: adjustedTime,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close: Number(k.c),
      };
      setCurrentPrice(Number(k.c));
      setCandles((prev) => {
        if (prev.length === 0) return [formatted];
        const last = prev[prev.length - 1];
        return last.time === formatted.time
          ? [...prev.slice(0, -1), formatted]
          : [...prev, formatted];
      });
    }

    // Si el backend ya no reconoce al usuario, ignorar el mensaj

    // Actualización de operación
    if (message?.status === false) {
      if (hasReset.current) return; // ✅ Ya se reseteó una vez, ignorar
      hasReset.current = true;
      console.log("❌ Operación cerrada. Limpiando valores.");
      setToolStates((prev) => ({
        ...INITIAL_TOOL_STATES,
        alert_up: { ...prev.alert_up, visible: true },
        alert_down: { ...prev.alert_down, visible: true },
      }));


    } else if (message?.status === true) {
       hasReset.current = false;
      //console.log("📩 Actualización de operación activa:", message);
      setToolStates((prev) => ({
        ...prev,
        entry_point: {
          ...prev.entry_point,
          value: message.entry_point ? parseFloat(message.entry_point) : prev.entry_point.value,
          visible: !!message.entry_point,
        },
        alert_up: {
          ...prev.alert_up,
          value: message.alert_up ? parseFloat(message.alert_up) : prev.alert_up.value,
          visible: !!message.alert_up,
        },
        alert_down: {
          ...prev.alert_down,
          value: message.alert_down ? parseFloat(message.alert_down) : prev.alert_down.value,
          visible: !!message.alert_down,
        },
        take_profit: {
          ...prev.take_profit,
          value: message.take_profit ? parseFloat(message.take_profit) : prev.take_profit.value,
          visible: !!message.take_profit,
        },
        stop_loss: {
          ...prev.stop_loss,
          value: message.stop_loss ? parseFloat(message.stop_loss) : prev.stop_loss.value,
          visible: !!message.stop_loss,
        },
        take_benefit: {
          ...prev.take_benefit,
          value: message.take_benefit ? parseFloat(message.take_benefit) : prev.take_benefit.value,
          visible: !!message.take_benefit,
        },
        active_alerts: true,
      }));

    }

  }, [symbol]);


  useEffect(() => {
    console.log("🚀 useEffect suscripción:", {
      pathname: location.pathname,
      symbol,
      interval,
      connected: socket?.connected,
    });
    // si la ruta no empieza con /trading o el socket no existe, salimos
    if (!location.pathname.startsWith("/trading") || !socket) return;

    const subscribeAndListen = () => {
      subscribeToSymbol(socket, symbol, interval);
      listenToData(socket, handleSocketData);
      listeningOperationActivated(socket, handleSocketData);
    };

    if (socket.connected) {
      subscribeAndListen();
    } else {
      socket.once("connect", subscribeAndListen);
    }
    socket.on("connect", subscribeAndListen);

    return () => {
      stopListening(socket);
      socket.off("connect", subscribeAndListen);
    };
  }, [socket, symbol, interval, location.pathname, handleSocketData]);





  useEffect(() => {
    if (!operationConfig) return;

    console.log("📩 operation_activated received:", operationConfig);

    if (operationConfig.status === false) {
      setToolStates((prev) => ({
        ...INITIAL_TOOL_STATES,
        alert_up: { ...prev.alert_up, visible: true },
        alert_down: { ...prev.alert_down, visible: true },
      })); // 🔧 Resetea todo correctamente
    } else {
      setToolStates((prev) => ({
        ...prev,
        entry_point: {
          ...prev.entry_point,
          value: operationConfig.entry_point ? parseFloat(operationConfig.entry_point) : prev.entry_point.value,
          visible: !!operationConfig.entry_point,
        },
        alert_up: {
          ...prev.alert_up,
          value: operationConfig.alert_up ? parseFloat(operationConfig.alert_up) : prev.alert_up.value,
          visible: !!operationConfig.alert_up,
        },
        alert_down: {
          ...prev.alert_down,
          value: operationConfig.alert_down ? parseFloat(operationConfig.alert_down) : prev.alert_down.value,
          visible: !!operationConfig.alert_down,
        },
        take_profit: {
          ...prev.take_profit,
          value: operationConfig.take_profit ? parseFloat(operationConfig.take_profit) : prev.take_profit.value,
          visible: !!operationConfig.take_profit,
        },
        stop_loss: {
          ...prev.stop_loss,
          value: operationConfig.stop_loss ? parseFloat(operationConfig.stop_loss) : prev.stop_loss.value,
          visible: !!operationConfig.stop_loss,
        },
        take_benefit: {
          ...prev.take_benefit,
          value: operationConfig.take_benefit ? parseFloat(operationConfig.take_benefit) : prev.take_benefit.value,
          visible: !!operationConfig.take_benefit,
        },
        active_alerts: operationConfig.status === true,
      }));
    }
  }, [operationConfig]);

  const handleLoadMoreData = useCallback(async (beforeTime) => {
    // Ajustamos el timestamp añadiendo 6h (3600 s × 6)
    const adjustedBefore = beforeTime + 6 * 3600;
    console.log("🔔 handleLoadMoreData llamado con beforeTime=", beforeTime, "→ adjustedBefore=", adjustedBefore);
    try {
      const newData = await fetchHistoricalData(symbol, interval, adjustedBefore);
      if (newData && newData.length > 0) {
        setCandles(prev => [...newData, ...prev]);
      } else {
        console.log("📭 No se encontraron más datos históricos.");
      }
    } catch (error) {
      console.error("❌ Error al cargar más datos históricos:", error);
    }
  }, [symbol, interval]);

  const mappedToolStates = {
    stop_loss: toolStates.stop_loss,
    take_profit: toolStates.take_profit,
    entry_point: toolStates.entry_point,
    break_even: toolStates.take_benefit,
    alert_up: toolStates.alert_up,
    alert_down: toolStates.alert_down,
    active_alerts: toolStates.active_alerts,
    active_operations: toolStates.active_operations
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <RingLoader color="#36d7b7" size={80} />
        </div>
      )}

      {/* ChartControls siempre arriba */}
      <div className="w-full bg-[#181A20] border border-blue-900 flex">

        <div className="w-1/4 p-2 flex items-center justify-center border-r border-blue-800">
          <MarkTicket price={currentPrice} symbol={symbol} />
        </div>
        {/* Columna izquierda: ChartControls (3/4) */}
        <div className="w-3/4 p-2 flex flex-wrap gap-2 justify-center">
          <ChartControls
            setCandles={setCandles}
            symbol={symbol}
            interval={interval}
            setSymbol={setSymbol}
            setInterval={setInterval}
            toolStates={mappedToolStates}
            setToolStates={setToolStates}
          />
        </div>

        {/* Columna derecha: Div de prueba (1/4) */}
        
      </div>


      {/* Contenido principal (solo la gráfica) */}
      <div className="flex-1 min-h-[400px] lg:my-0">
        <div className="ml-1 mr-1">
          <CandleChart
            data={candles}
            toolStates={toolStates}
            setToolStates={setToolStates}
            onLoadMore={handleLoadMoreData}
          />
        </div>
      </div>

      {/* ToolInputs siempre abajo */}
      <div className="w-full bg-[#181A20] p-2 border border-blue-900 flex gap-2 overflow-x-auto whitespace-nowrap justify-center">

        {Object.entries(toolStates)
          .filter(([key]) => key !== "active_alerts" && key !== "active_operations")
          .map(([tool, { value }]) => {
            const isAlwaysDisabled = ["take_profit", "stop_loss", "take_benefit"].includes(tool);
            const isEditable = ["entry_point", "alert_up", "alert_down"].includes(tool);
            return (
              <ToolInput
                key={tool}
                label={tool}
                value={value}
                setValue={(newVal) =>
                  setToolStates(prev => ({
                    ...prev,
                    [tool]: { ...prev[tool], value: newVal, visible: newVal !== 0 },
                  }))
                }
                disabled={isAlwaysDisabled || (isEditable && !toolStates.active_alerts)}
              />
            );
          })}
      </div>
      <div className="w-full bg-[#181A20] p-2 border border-blue-900 flex gap-2 overflow-x-auto whitespace-nowrap justify-center">

        <TableResults symbol={symbol} />
      </div>

      {!loading && hasFetched && candles.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No hay datos disponibles.
        </p>
      )}
    </div>
  );



};

export default ChartDataProvider;
