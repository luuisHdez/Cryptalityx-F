import React, { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, CrosshairMode } from "lightweight-charts";

const TOOL_COLORS = {
  stop_loss: "red",
  take_profit: "green",
  entry_point: "blue",
  break_even: "gray",
  alert_up: "orange",
  alert_down: "purple",
};

const CandleChart = ({ data, toolStates, setToolStates, onLoadMore }) => {
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const candlestickSeries = useRef(null);
  const linesRef = useRef({});
  const legendContentRef = useRef(null);
  const lastCandleRef = useRef(null);
  const earliestLoadedTimeRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);

  // Mantener referencia estable de onLoadMore
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  // Crear gráfico y leyenda
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#0b0e11" },
        textColor: "#eaecef",
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
      },
      grid: { vertLines: { color: "#1e2026" }, horzLines: { color: "#1e2026" } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
           timeVisible: true,
           borderColor: "#3a3a3a",
           barSpacing: 10,
           handleScroll: {
             mouseWheel: true,
             pressedMouseMove: true,
           },
         },
    });
    chartInstance.current = chart;

    candlestickSeries.current = chart.addSeries(CandlestickSeries, {
      upColor: "#0ecb81",
      downColor: "#f6465d",
      borderVisible: false,
      wickUpColor: "#0ecb81",
      wickDownColor: "#f6465d",
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    });
    resizeObserver.observe(chartContainerRef.current);

    // Leyenda contenedor
    const legendContainer = document.createElement("div");
    legendContainer.className =
      "absolute top-0 left-0 w-full z-50 bg-[#131722] text-white text-xs px-4 py-2 flex items-center gap-4";
    legendContainer.style.height = "24px";
    chartContainerRef.current.appendChild(legendContainer);

    // Botón toggler de leyenda
    const toggleButton = document.createElement("div");
    toggleButton.innerHTML = `<svg class=\"w-4 h-4\" viewBox=\"0 0 16 16\"><path fill=\"#929AA5\" d=\"M7.9 8.1L10.5 5.5 11.7 6.7 7.9 10.4 6.7 9.3 4.2 6.7 5.3 5.5z\"/></svg>`;
    toggleButton.style.cursor = "pointer";
    toggleButton.className = "flex items-center justify-center mr-2";
    legendContainer.appendChild(toggleButton);

    // Contenido
    const legendContent = document.createElement("div");
    legendContent.className = "flex gap-4 overflow-hidden";
    legendContent.innerHTML = `
      <div id=\"legend-time\"><span>-</span></div>
      <div id=\"legend-open\">OPEN: <span>-</span></div>
      <div id=\"legend-high\">HIGH: <span>-</span></div>
      <div id=\"legend-low\">LOW: <span>-</span></div>
      <div id=\"legend-close\">CLOSE: <span>-</span></div>
    `;
    legendContainer.appendChild(legendContent);
    legendContentRef.current = legendContent;

    let expanded = false;
    toggleButton.onclick = () => {
      expanded = !expanded;
      legendContent.style.display = expanded ? "none" : "flex";
    };

    // Crosshair move
    chart.subscribeCrosshairMove(param => {
      const cd = param?.seriesData?.get(candlestickSeries.current);
      if (!cd) return;
      const ts = typeof param.time === "number" ? param.time : param.time.timestamp;
      const dataPoint = { open: cd.open, high: cd.high, low: cd.low, close: cd.close, time: ts };
      const date = new Date(ts * 1000).toLocaleString("sv-SE", { timeZone: "UTC" });
      const color = cd.close > cd.open ? "#0ecb81" : cd.close < cd.open ? "#f6465d" : "#eaecef";
      if (legendContentRef.current) {
        legendContentRef.current.querySelector("#legend-time span").textContent = date;
        ["open","high","low","close"].forEach(name => {
          const el = legendContentRef.current.querySelector(`#legend-${name} span`);
          el.textContent = cd[name]; el.style.color = name !== "time" ? color : undefined;
        });
      }
    });

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Actualiza earliestLoadedTime al cambiar datos
  useEffect(() => {
    if (data?.length) earliestLoadedTimeRef.current = data[0].time;
  }, [data]);

  // Scroll hacia atrás -> carga más datos
  // -- scroll hacia atrás para cargar más datos --
  useEffect(() => {
      const chart = chartInstance.current;
      if (!chart) return;
      const timeScale = chart.timeScale();
    
      // solo dispara cuando 'from' llega a 0 (el primer candle)
      const handler = ({ from }) => {
        if (from <= 0 && !isLoadingMoreRef.current) {
          isLoadingMoreRef.current = true;
          onLoadMoreRef.current(earliestLoadedTimeRef.current)
            .finally(() => { isLoadingMoreRef.current = false; });
        }
      };
    
      timeScale.subscribeVisibleLogicalRangeChange(handler);
      return () => {
        timeScale.unsubscribeVisibleLogicalRangeChange(handler);
      };
    }, []);

  // Renderiza velas
  useEffect(() => {
    if (!data || !candlestickSeries.current) return;
    candlestickSeries.current.setData(data);
    lastCandleRef.current = data[data.length - 1];
  }, [data]);

  // Líneas dinámicas
  useEffect(() => {
    if (!candlestickSeries.current) return;
    Object.entries(toolStates).forEach(([tool,{visible,value}]) => {
      if ((!visible||!value)&&linesRef.current[tool]){
        candlestickSeries.current.removePriceLine(linesRef.current[tool]);
        linesRef.current[tool]=null;
      } else if (visible&&value) {
        if (!linesRef.current[tool]) {
          linesRef.current[tool] = candlestickSeries.current.createPriceLine({ price:value, color:TOOL_COLORS[tool], lineWidth:3, lineStyle:0, axisLabelVisible:true, title:tool});
        } else {
          linesRef.current[tool].applyOptions({ price:value });
        }
      }
    });
  }, [toolStates,data]);

  return <div ref={chartContainerRef} className="w-full h-[400px] relative" />;
};

export default CandleChart;