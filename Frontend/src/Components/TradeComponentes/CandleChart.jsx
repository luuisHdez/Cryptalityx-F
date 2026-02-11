import React, { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
} from "lightweight-charts";

const TOOL_COLORS = {
  stop_loss: "red",
  take_profit: "green",
  entry_point: "blue",
  break_even: "gray",
  alert_up: "orange",
  alert_down: "purple",
};

const CandleChart = ({ data, toolStates, onLoadMore }) => {
  const chartContainerRef = useRef(null);
  const priceChartRef = useRef(null);
  const volumeChartRef = useRef(null);

  const overlayVertRef = useRef(null);
  const overlayHorzRef = useRef(null);

  const priceChart = useRef(null);
  const volumeChart = useRef(null);

  const candleSeries = useRef(null);
  const volumeSeries = useRef(null);

  const linesRef = useRef({});
  const legendContentRef = useRef(null);

  const earliestLoadedTimeRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  // ===============================
  // INIT CHARTS
  // ===============================
  useEffect(() => {
    if (!priceChartRef.current || !volumeChartRef.current) return;

    priceChart.current = createChart(priceChartRef.current, {
      layout: {
        background: { color: "#0b0e11" },
        textColor: "#eaecef",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#1e2026" },
        horzLines: { color: "#1e2026" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        scaleMargins: { top: 0.1, bottom: 0.1 },
        minimumWidth: 80,
      },
      timeScale: {
       visible: false,
      },
    });

    candleSeries.current = priceChart.current.addSeries(
      CandlestickSeries,
      {
        upColor: "#0ecb81",
        downColor: "#f6465d",
        wickUpColor: "#0ecb81",
        wickDownColor: "#f6465d",
        borderVisible: false,
        priceFormat: {
          type: "price",
          precision: 4,
          minMove: 0.0001,
        },
      }
    );

    volumeChart.current = createChart(volumeChartRef.current, {
      layout: {
        background: { color: "#0b0e11" },
        textColor: "#eaecef",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#1e2026" },
        horzLines: { color: "#1e2026" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        scaleMargins: { top: 0, bottom: 0.15 },
        minimumWidth: 80,
      },
      timeScale: {
        visible: true,
  timeVisible: true,
  secondsVisible: false,
      },
    });

    volumeSeries.current = volumeChart.current.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
      }
    );

    // ===============================
    // AUTO-RESIZE
    // ===============================
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      priceChart.current.resize(width, height * 0.7);
      volumeChart.current.resize(width, height * 0.3);
    });

    resizeObserver.observe(chartContainerRef.current);

    // ===============================
    // SYNC ZOOM / SCROLL
    // ===============================
    const syncRange = (source, target) => range => {
      if (range) {
        target.timeScale().setVisibleLogicalRange(range);
      }
    };

    priceChart.current.timeScale()
      .subscribeVisibleLogicalRangeChange(
        syncRange(priceChart.current, volumeChart.current)
      );

    volumeChart.current.timeScale()
      .subscribeVisibleLogicalRangeChange(
        syncRange(volumeChart.current, priceChart.current)
      );

    // ===============================
    // LOAD MORE
    // ===============================
    priceChart.current.timeScale()
      .subscribeVisibleLogicalRangeChange(range => {
        if (!range || range.from > 0) return;
        if (isLoadingMoreRef.current) return;

        isLoadingMoreRef.current = true;
        onLoadMoreRef.current?.(earliestLoadedTimeRef.current)
          ?.finally(() => {
            isLoadingMoreRef.current = false;
          });
      });

    // ===============================
    // LEGEND
    // ===============================
    const legend = document.createElement("div");
    legend.className =
      "absolute top-0 left-0 w-full z-50 bg-[#131722] text-white text-xs px-4 py-2 flex gap-4";
    priceChartRef.current.appendChild(legend);

    legend.innerHTML = `
      <div id="legend-time">-</div>
      <div id="legend-open">OPEN: -</div>
      <div id="legend-high">HIGH: -</div>
      <div id="legend-low">LOW: -</div>
      <div id="legend-close">CLOSE: -</div>
    `;

    legendContentRef.current = legend;

    const legendTime = legend.querySelector("#legend-time");
    const legendOpen = legend.querySelector("#legend-open");
    const legendHigh = legend.querySelector("#legend-high");
    const legendLow = legend.querySelector("#legend-low");
    const legendClose = legend.querySelector("#legend-close");

    // ===============================
    // CROSSHAIR → OVERLAY (PRICE) PERSISTENTE
    // ===============================
    priceChart.current.subscribeCrosshairMove(param => {
      if (!param || !param.point) {
        overlayVertRef.current.style.display = "none";
        overlayHorzRef.current.style.display = "none";
        return;
      }

      const { x, y } = param.point;

      overlayVertRef.current.style.transform = `translateX(${x}px)`;
      overlayVertRef.current.style.display = "block";

      overlayHorzRef.current.style.transform = `translateY(${y}px)`;
      overlayHorzRef.current.style.display = "block";

      const cd = param.seriesData.get(candleSeries.current);
      if (cd && param.time) {
        const ts =
          typeof param.time === "number"
            ? param.time
            : param.time.timestamp;

        const date = new Date(ts * 1000).toLocaleString("sv-SE", {
          timeZone: "UTC",
        });

        legendTime.textContent = date;
        legendOpen.textContent = `OPEN: ${cd.open}`;
        legendHigh.textContent = `HIGH: ${cd.high}`;
        legendLow.textContent = `LOW: ${cd.low}`;
        legendClose.textContent = `CLOSE: ${cd.close}`;
      }
    });

    // ===============================
    // CROSSHAIR → OVERLAY (VOLUME) PERSISTENTE
    // ===============================
    volumeChart.current.subscribeCrosshairMove(param => {
      if (!param || !param.point) return;

      const { x, y } = param.point;
      const priceChartHeight = priceChartRef.current.clientHeight;

      overlayVertRef.current.style.transform = `translateX(${x}px)`;
      overlayVertRef.current.style.display = "block";

      overlayHorzRef.current.style.transform =
        `translateY(${priceChartHeight + y}px)`;
      overlayHorzRef.current.style.display = "block";
    });

    return () => {
      resizeObserver.disconnect();
      priceChart.current.remove();
      volumeChart.current.remove();
    };
  }, []);

  // ===============================
  // SET DATA
  // ===============================
  useEffect(() => {
    if (!data?.length) return;

    earliestLoadedTimeRef.current = data[0].time;

    candleSeries.current.setData(data);

    volumeSeries.current.setData(
      data.map(c => ({
        time: c.time,
        value: Number(c.volume || c.v || c.k?.v || 0),
        color:
          c.close >= c.open
            ? "rgba(14,203,129,0.5)"
            : "rgba(246,70,93,0.5)",
      }))
    );
  }, [data]);

  // ===============================
  // PRICE LINES
  // ===============================
  useEffect(() => {
    if (!candleSeries.current) return;

    Object.entries(toolStates).forEach(([tool, { visible, value }]) => {
      if ((!visible || !value) && linesRef.current[tool]) {
        candleSeries.current.removePriceLine(linesRef.current[tool]);
        linesRef.current[tool] = null;
        return;
      }

      if (visible && value) {
        if (!linesRef.current[tool]) {
          linesRef.current[tool] =
            candleSeries.current.createPriceLine({
              price: value,
              color: TOOL_COLORS[tool],
              lineWidth: 2,
              axisLabelVisible: true,
              title: tool,
            });
        } else {
          linesRef.current[tool].applyOptions({ price: value });
        }
      }
    });
  }, [toolStates, data]);

  // ===============================
  // RENDER
  // ===============================
  return (
    <div
      ref={chartContainerRef}
      className="w-full h-[500px] flex flex-col relative"
    >
      <div
        ref={overlayVertRef}
        className="absolute top-0 left-0 h-full w-px bg-white/40 pointer-events-none z-50"
        style={{ display: "none" }}
      />

      <div
        ref={overlayHorzRef}
        className="absolute left-0 w-full h-px bg-white/40 pointer-events-none z-50"
        style={{ display: "none" }}
      />

      <div ref={priceChartRef} className="w-full h-[70%] relative" />
      <div ref={volumeChartRef} className="w-full h-[30%]" />
    </div>
  );
};

export default CandleChart;
