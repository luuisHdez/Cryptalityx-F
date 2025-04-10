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

const CandleChart = ({ data, toolStates, setToolStates }) => {
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const candlestickSeries = useRef(null);
  const linesRef = useRef({});
  const legendContentRef = useRef(null); // ✅ nuevo ref para leyenda
  const lastCandleRef = useRef(null);
  const isHoveringRef = useRef(false);
  

  // Crear gráfico
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartInstance.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#0b0e11" },
        textColor: "#eaecef",
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: "#1e2026" },
        horzLines: { color: "#1e2026" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        timeVisible: true,
        borderColor: "#3a3a3a",
        barSpacing: 10,
      },
    });

    candlestickSeries.current = chartInstance.current.addSeries(CandlestickSeries, {
      upColor: "#0ecb81",
      downColor: "#f6465d",
      borderVisible: false,
      wickUpColor: "#0ecb81",
      wickDownColor: "#f6465d",
      priceFormat: {
        type: "price",
        precision: 4,
        minMove: 0.0001,
      },
    });

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (chartInstance.current && chartContainerRef.current) {
        chartInstance.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    // Leyenda
    const legendContainer = document.createElement("div");
    legendContainer.className =
      "absolute top-0 left-0 w-full z-50 bg-[#131722] text-white text-xs px-4 py-2 flex items-center gap-4 transition-all duration-300";
    legendContainer.style.height = "24px";

    const toggleButton = document.createElement("div");
    toggleButton.innerHTML = `
      <svg class="legend-toggle-icon w-[16px] h-[16px] transition-transform duration-300" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd"
          d="M7.92656 8.11751L10.5192 5.52486L11.6977 6.70337L7.92648 10.4746L6.74797 9.2961L6.74805 9.29602L4.15527 6.70325L5.33378 5.52474L7.92656 8.11751Z"
          fill="#929AA5"
        ></path>
      </svg>
    `;
    toggleButton.style.cursor = "pointer";
    toggleButton.className = "flex items-center justify-center mr-2";

    const legendContent = document.createElement("div");
    legendContent.className = "flex gap-4 overflow-hidden";
    legendContent.innerHTML = `
      <div id="legend-time"> <span class="legend-val">-</span></div>
      <div id="legend-open">OPEN: <span class="legend-val">-</span></div>
      <div id="legend-high">HIGH: <span class="legend-val">-</span></div>
      <div id="legend-low">LOW: <span class="legend-val">-</span></div>
      <div id="legend-close">CLOSE: <span class="legend-val">-</span></div>
    `;
    legendContentRef.current = legendContent;

    legendContainer.appendChild(toggleButton);
    legendContainer.appendChild(legendContent);
    chartContainerRef.current.appendChild(legendContainer);

    let isExpanded = false;
    toggleButton.onclick = () => {
      isExpanded = !isExpanded;
      toggleButton.querySelector("svg").style.transform = isExpanded ? "rotate(180deg)" : "rotate(0deg)";
      legendContent.style.display = isExpanded ? "none" : "flex";
    };

    // Crosshair
    chartInstance.current.subscribeCrosshairMove(param => {
      const candleData = param?.seriesData?.get(candlestickSeries.current);
      const time = param?.time;
    
      const updateLegend = ({ open, high, low, close, time: candleTime }) => {
        const date = new Date(candleTime * 1000);
        const formatted = date.toLocaleString("sv-SE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        });
    
        const color = close > open ? "#0ecb81" : close < open ? "#f6465d" : "#eaecef";
    
        if (legendContentRef.current) {
          const timeEl = legendContentRef.current.querySelector("#legend-time");
          if (timeEl) timeEl.textContent = `${formatted}`;
    
          const openEl = legendContentRef.current.querySelector("#legend-open .legend-val");
          if (openEl) openEl.textContent = open;
    
          const highEl = legendContentRef.current.querySelector("#legend-high .legend-val");
          if (highEl) highEl.textContent = high;
    
          const lowEl = legendContentRef.current.querySelector("#legend-low .legend-val");
          if (lowEl) lowEl.textContent = low;
    
          const closeEl = legendContentRef.current.querySelector("#legend-close .legend-val");
          if (closeEl) closeEl.textContent = close;
    
          ["#legend-open", "#legend-high", "#legend-low", "#legend-close"].forEach(id => {
            const el = legendContentRef.current.querySelector(`${id} .legend-val`);
            if (el) el.style.color = color;
          });
        }
      };
    
      if (!isHoveringRef.current) {
        if (lastCandleRef.current) updateLegend(lastCandleRef.current);
        return;
      }
      
      if (!param?.point || !time || !candleData) return;
    
      // ✅ Renombramos para evitar conflicto con `open`, `high`, etc.
      const candleOpen = candleData.open;
      const candleHigh = candleData.high;
      const candleLow = candleData.low;
      const candleClose = candleData.close;
      const timestamp = typeof time === "number" ? time : time.timestamp;
    
      updateLegend({
        open: candleOpen,
        high: candleHigh,
        low: candleLow,
        close: candleClose,
        time: timestamp,
      });
    });
    const container = chartContainerRef.current;
    const handleEnter = () => { isHoveringRef.current = true };
    const handleLeave = () => { isHoveringRef.current = false };

    container.addEventListener("mouseenter", handleEnter);
    container.addEventListener("mouseleave", handleLeave);
    

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("mouseenter", handleEnter);
      container.removeEventListener("mouseleave", handleLeave);
      chartInstance.current?.remove();
      chartInstance.current = null;
      candlestickSeries.current = null;
    };
  }, []);

  // Setear datos
  useEffect(() => {
    if (!data || data.length === 0 || !candlestickSeries.current) return;

    candlestickSeries.current.setData(data);

    const last = data[data.length - 1];

    if (last) {
      lastCandleRef.current = last;

      if (!isHoveringRef.current) {
      const date = new Date(last.time * 1000);
      const formatted = date.toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      });

      const color = last.close > last.open ? "#0ecb81" : last.close < last.open ? "#f6465d" : "#eaecef";

      if (legendContentRef.current) {
        const timeEl = legendContentRef.current.querySelector("#legend-time");
        if (timeEl) timeEl.textContent = `${formatted}`;
      
        const openEl = legendContentRef.current.querySelector("#legend-open .legend-val");
        if (openEl) openEl.textContent = last.open;
      
        const highEl = legendContentRef.current.querySelector("#legend-high .legend-val");
        if (highEl) highEl.textContent = last.high;
      
        const lowEl = legendContentRef.current.querySelector("#legend-low .legend-val");
        if (lowEl) lowEl.textContent = last.low;
      
        const closeEl = legendContentRef.current.querySelector("#legend-close .legend-val");
        if (closeEl) closeEl.textContent = last.close;
      
        ["#legend-open", "#legend-high", "#legend-low", "#legend-close"].forEach(id => {
          const el = legendContentRef.current.querySelector(`${id} .legend-val`);
          if (el) el.style.color = color;
        });
      }
    }
  }
}, [data]);

  // Líneas dinámicas
  useEffect(() => {
    if (!candlestickSeries.current || data.length === 0) return;

    Object.entries(toolStates).forEach(([tool, { visible, value }]) => {
      if ((!visible || !value) && linesRef.current[tool]) {
        candlestickSeries.current.removePriceLine(linesRef.current[tool]);
        linesRef.current[tool] = null;
        return;
      }

      if (visible && value) {
        const price = value;
        if (!linesRef.current[tool]) {
          linesRef.current[tool] = candlestickSeries.current.createPriceLine({
            price,
            color: TOOL_COLORS[tool],
            lineWidth: 3,
            lineStyle: 0,
            axisLabelVisible: true,
            title: tool.replace("_", " "),
          });
        } else {
          linesRef.current[tool].applyOptions({ price });
        }
      }
    });
  }, [toolStates, data]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-[400px] relative z-10 bg-[var(--color-BasicBg)]"
    />
  );
};

export default CandleChart;
