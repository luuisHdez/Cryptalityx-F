import React, { useState, useEffect, useCallback } from "react";
import { fetchHistoricalData, fetchUpdatedData } from "../../API/APIService";
import ChartControls from "./ChartControls";
import CandleChart from "./CandleChart";
import ToolInput from "./ToolInput";
import { useLocation } from "react-router-dom";
import { RingLoader } from "react-spinners";
import OrderBook from "./OrderBook";
import MiniHeader from "./MiniHeader";

const INITIAL_TOOL_STATES = {
  activeOperation: false,
  SL: { visible: false, value: "" },
  TK: { visible: false, value: "" },
  EPt: { visible: false, value: "" },
  TB: { visible: false, value: "" },
  AU: { visible: false, value: "" },
  AD: { visible: false, value: "" },
};

const ChartDataProvider = ({ symbol, interval, setSymbol, setInterval, operationConfig }) => {
  const [candles, setCandles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [toolStates, setToolStates] = useState(INITIAL_TOOL_STATES);
  const [selectedView, setSelectedView] = useState("chart");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();

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


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/trading") return;
  
    const handleSocketData = (message) => {
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
    if (message?.status === "closed") {
      console.log("❌ Operación cerrada. Limpiando valores.");
      setToolStates((prev) => ({
    ...INITIAL_TOOL_STATES,
    AU: { ...prev.AU, visible: true },
    AD: { ...prev.AD, visible: true },
  }));

    } else if (message?.status === "active") {
      console.log("📩 Actualización de operación activa:", message);
      setToolStates((prev) => ({
        ...prev,
        EPt: {
          ...prev.EPt,
          value: message.entry_point ? parseFloat(message.entry_point) : prev.EPt.value,
          visible: !!message.entry_point,
        },
        AU: {
          ...prev.AU,
          value: message.alert_up ? parseFloat(message.alert_up) : prev.AU.value,
          visible: !!message.alert_up,
        },
        AD: {
          ...prev.AD,
          value: message.alert_down ? parseFloat(message.alert_down) : prev.AD.value,
          visible: !!message.alert_down,
        },
        TK: {
          ...prev.TK,
          value: message.take_profit ? parseFloat(message.take_profit) : prev.TK.value,
          visible: !!message.take_profit,
        },
        SL: {
          ...prev.SL,
          value: message.stop_loss ? parseFloat(message.stop_loss) : prev.SL.value,
          visible: !!message.stop_loss,
        },
        TB: {
          ...prev.TB,
          value: message.take_benefit ? parseFloat(message.take_benefit) : prev.TB.value,
          visible: !!message.take_benefit,
        },
        activeOperation: true,
      }));
    }
  };

  window.apiTrade.listenToData(handleSocketData);
  return () => window.apiTrade.stopListening();
}, [symbol, interval, location.pathname]);
  

useEffect(() => {
  if (!operationConfig) return;

  console.log("📩 operation_activated received:", operationConfig);

  if (operationConfig.status === "closed") {
    setToolStates({ ...INITIAL_TOOL_STATES });setToolStates((prev) => ({
    ...INITIAL_TOOL_STATES,
    AU: { ...prev.AU, visible: true },
    AD: { ...prev.AD, visible: true },
  })); // 🔧 Resetea todo correctamente
  } else {
    setToolStates((prev) => ({
      ...prev,
      EPt: {
        ...prev.EPt,
        value: operationConfig.entry_point ? parseFloat(operationConfig.entry_point) : prev.EPt.value,
        visible: !!operationConfig.entry_point,
      },
      AU: {
        ...prev.AU,
        value: operationConfig.alert_up ? parseFloat(operationConfig.alert_up) : prev.AU.value,
        visible: !!operationConfig.alert_up,
      },
      AD: {
        ...prev.AD,
        value: operationConfig.alert_down ? parseFloat(operationConfig.alert_down) : prev.AD.value,
        visible: !!operationConfig.alert_down,
      },
      TK: {
        ...prev.TK,
        value: operationConfig.take_profit ? parseFloat(operationConfig.take_profit) : prev.TK.value,
        visible: !!operationConfig.take_profit,
      },
      SL: {
        ...prev.SL,
        value: operationConfig.stop_loss ? parseFloat(operationConfig.stop_loss) : prev.SL.value,
        visible: !!operationConfig.stop_loss,
      },
      TB: {
        ...prev.TB,
        value: operationConfig.take_benefit ? parseFloat(operationConfig.take_benefit) : prev.TB.value,
        visible: !!operationConfig.take_benefit,
      },
      activeOperation: operationConfig.status === "active",
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


  
  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <RingLoader color="#36d7b7" size={80} />
        </div>
      )}
      <div className=" flex space-x-2 mb-2">
        <div className="bg-[#181A20] w-1/2">
          {/* Aquí puedes agregar contenido en el futuro */}
        </div>

        <div className="bg-[#181A20] w-1/2">
          <ChartControls 
          setCandles={setCandles}
          symbol={symbol}
          interval={interval}
          setSymbol={setSymbol}
          setInterval={setInterval}
          toolStates={toolStates}
          setToolStates={setToolStates}
        />
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row w-full max-w-full px-2 min-h-[400px]">
  {/* Lateral izquierdo (solo visible en grande) */}
  <div className=" border border-gray-700 hidden lg:grid grid-cols-2 gap-1 w-[250px] bg-[#181A20] p-2">
    <OrderBook />
  </div>

  {/* Contenido principal */}
  <div className="flex-1 min-h-[400px] lg:my-0">
    {/* MiniHeader — siempre visible pero contenido dentro del gráfico */}
    <div className="w-full  p-1 shadow-md z-10">
      <MiniHeader
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        isMobile={isMobile}
      />
    </div>

    {/* Móviles: mostrar según tab */}
    {isMobile ? (
      <>
        {selectedView === "chart" && (
          <div className="ml-1 mr-1">
          <CandleChart
            data={candles}
            toolStates={toolStates}
            setToolStates={setToolStates}
            onLoadMore={handleLoadMoreData} 
          />
        </div>
        )}
        {selectedView === "orderbook" && <OrderBook />}
        {selectedView === "controls" && (
          <div className="bg-[#181A20] p-2 h-[400px]  grid grid-cols-2 gap-1 ml-1 mr-1">
            {Object.entries(toolStates)
              .filter(([key]) => key !== "activeOperation")
              .map(([tool, { value }]) => {
                const isAlwaysDisabled = ["TK", "SL", "TB"].includes(tool);
                const isEditable = ["EPt", "AU", "AD"].includes(tool);

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
                    disabled={isAlwaysDisabled || (isEditable && !toolStates.activeOperation)}

                  />
                );
              })}
          </div>
        )}
        {selectedView === "info" && (
          <div className="ml-1 mr-1  border border-gray-700  flex-1 h-[400px] bg-[#181A20] p-2 text-white text-sm border border-gray-700">


            [Pendiente: Componente Info]
          </div>
        )}
        {selectedView === "trading_data" && (
          <div className="ml-1 mr-1  border border-gray-700  flex-1 h-[400px] bg-[#181A20] p-2 text-white text-sm border border-gray-700">


            [Pendiente: Trading Data]
          </div>
        )}
        {selectedView === "square" && (
          <div className="ml-1 mr-1  border border-gray-700  flex-1 h-[400px] bg-[#181A20] p-2 text-white text-sm border border-gray-700">


            [Pendiente: Square]
          </div>
        )}
      </>
    ) : (
      <>
        {selectedView === "chart" && (
          <div className="ml-1 mr-1">
          <CandleChart
            data={candles}
            toolStates={toolStates}
            setToolStates={setToolStates}
            onLoadMore={handleLoadMoreData} 
          />
        </div>
        )}
    
        {selectedView === "info" && (
          <div className="bg-[#181A20] p-2 h-[400px] text-white text-sm  border border-gray-700  ml-1 mr-1  ">
            [Componente Info en escritorio]
          </div>
        )}
    
        {selectedView === "trading_data" && (
          <div className="bg-[#181A20] p-2 h-[400px] text-white text-sm  border border-gray-700  ml-1 mr-1">
            [Componente Trading Data en escritorio]
          </div>
        )}
    
        {selectedView === "square" && (
          <div className="bg-[#181A20] p-2 h-[400px] text-white text-sm  border border-gray-700  ml-1 mr-1">
            [Componente Square en escritorio]
          </div>
        )}
      </>
    )}
    
  </div>

  {/* Lateral derecho (solo visible en grande) */}
  <div className="hidden lg:grid grid-cols-2 gap-1 w-[250px] bg-[#181A20] p-2">
  {Object.entries(toolStates)
  .filter(([key]) => key !== "activeOperation")
  .map(([tool, { value }]) => {
    const isAlwaysDisabled = ["TK", "SL", "TB"].includes(tool);
    const isEditable = ["EPt", "AU", "AD"].includes(tool);
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
        disabled={isAlwaysDisabled || (isEditable && !toolStates.activeOperation)}

      />
    );
  })}

  </div>
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
