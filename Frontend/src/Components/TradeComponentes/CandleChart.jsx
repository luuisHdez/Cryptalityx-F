import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
  createSeriesMarkers,
} from "lightweight-charts";

// Flechas de señal ML: mismo estilo que Analytics (long ▲ verde bajo la vela,
// short ▼ roja sobre la vela). Clic en la vela muestra la probabilidad.
const SIGNAL_COLORS = { long: "#0ecb81", short: "#f6465d" };

const TOOL_COLORS = {
  stop_loss: "red",
  take_profit: "green",
  entry_point: "blue",
  break_even: "gray",
  alert_up: "orange",
  alert_down: "purple",
};

// Zona horaria de visualización: UTC-6. Los datos llegan en UTC real desde el
// backend; aquí solo se DESPLAZA la presentación (etiquetas del eje y tooltip)
// para que el usuario vea su hora local sin alterar los timestamps.
const DISPLAY_UTC_OFFSET_HOURS = -6;
const DISPLAY_OFFSET_SECONDS = DISPLAY_UTC_OFFSET_HOURS * 3600;

// Formatea un timestamp (segundos UTC) a una etiqueta en la zona de display.
// A PRUEBA DE FALLOS: lightweight-charts puede pasar el tiempo como número
// (segundos) o como objeto {year,month,day} en escalas de día. Si no es un
// número válido, devolvemos una cadena vacía en vez de lanzar excepción (una
// excepción aquí congela el render del gráfico).
const formatDisplayTime = (time) => {
  if (typeof time !== "number" || !Number.isFinite(time)) return "";
  const d = new Date((time + DISPLAY_OFFSET_SECONDS) * 1000);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatDisplayDateTime = (time) => {
  if (typeof time !== "number" || !Number.isFinite(time)) return "";
  const d = new Date((time + DISPLAY_OFFSET_SECONDS) * 1000);
  if (isNaN(d.getTime())) return "";
  try {
    return d.toISOString().slice(0, 16).replace("T", " ");
  } catch {
    return "";
  }
};

const CandleChart = ({ data, signals = [], toolStates, onLoadMore }) => {
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

  // Marcadores de señales ML y vela seleccionada (segundos UTC) para mostrar la prob.
  const markersRef = useRef(null);
  const [selectedSignalTime, setSelectedSignalTime] = useState(null);
  const signalsRef = useRef(signals);
  signalsRef.current = signals;

  const earliestLoadedTimeRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);

  // Estado del último render para decidir entre setData (full) y update (incremental)
  const lastLenRef = useRef(0);
  const lastFirstTimeRef = useRef(null);
  const lastBarTimeRef = useRef(null);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

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
      // Eje de tiempo en hora de display (UTC-6) sin alterar los datos.
      timeScale: {
        visible: true,
        tickMarkFormatter: (time) => formatDisplayTime(time),
      },
      localization: {
        timeFormatter: (time) => formatDisplayDateTime(time),
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

    markersRef.current = createSeriesMarkers(candleSeries.current, []);

    // Clic sobre una vela con señal -> seleccionarla (muestra la probabilidad);
    // clic en otra vela la deselecciona.
    priceChart.current.subscribeClick((param) => {
      if (typeof param?.time !== "number") return;
      const hit = signalsRef.current.some((s) => Math.floor(s.ts / 1000) === param.time);
      setSelectedSignalTime((prev) => (hit && prev !== param.time ? param.time : null));
    });

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
        tickMarkFormatter: (time) => formatDisplayTime(time),
      },
      localization: {
        timeFormatter: (time) => formatDisplayDateTime(time),
      },
    });

    volumeSeries.current = volumeChart.current.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" } }
    );

    const volumeLegend = document.createElement("div");
    volumeLegend.className =
      "absolute top-0 left-0 px-3 py-1 text-xs z-50";
    volumeLegend.innerHTML =
      `<span id="volume-legend-value">Volume -</span>`;
    volumeChartRef.current.appendChild(volumeLegend);
    const volumeLegendValue =
      volumeLegend.querySelector("#volume-legend-value");

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      priceChart.current.resize(width, height * 0.7);
      volumeChart.current.resize(width, height * 0.3);
    });

    resizeObserver.observe(chartContainerRef.current);

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

    const legend = document.createElement("div");
    legend.className =
      "absolute top-0 left-0 w-full z-50 bg-[#131722] text-xs px-4 py-2 flex gap-4";
    priceChartRef.current.appendChild(legend);

    legend.innerHTML = `
      <div id="legend-time">-</div>
      <div id="legend-open">OPEN: -</div>
      <div id="legend-high">HIGH: -</div>
      <div id="legend-low">LOW: -</div>
      <div id="legend-close">CLOSE: -</div>
    `;

    const legendTime = legend.querySelector("#legend-time");
    const legendOpen = legend.querySelector("#legend-open");
    const legendHigh = legend.querySelector("#legend-high");
    const legendLow = legend.querySelector("#legend-low");
    const legendClose = legend.querySelector("#legend-close");

    const updateLegend = (candle) => {
      if (!candle) return;

      const isBullish = candle.close >= candle.open;
      const color = isBullish ? "#0ecb81" : "#f6465d";

      // Hora en la zona de display (UTC-6) sobre el timestamp UTC real.
      const date = formatDisplayDateTime(candle.time);

      legendTime.textContent = date;
      legendOpen.textContent = `OPEN: ${candle.open}`;
      legendHigh.textContent = `HIGH: ${candle.high}`;
      legendLow.textContent = `LOW: ${candle.low}`;
      legendClose.textContent = `CLOSE: ${candle.close}`;

      legendOpen.style.color = color;
      legendHigh.style.color = color;
      legendLow.style.color = color;
      legendClose.style.color = color;
    };

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

      let cd = param.seriesData.get(candleSeries.current);

      if (!cd && data?.length) {
        cd = data[data.length - 1];
      }

      updateLegend(cd);
    });

    volumeChart.current.subscribeCrosshairMove(param => {
      if (!param || !param.point) return;

      const { x, y } = param.point;
      const priceChartHeight = priceChartRef.current.clientHeight;

      overlayVertRef.current.style.transform = `translateX(${x}px)`;
      overlayVertRef.current.style.display = "block";

      overlayHorzRef.current.style.transform =
        `translateY(${priceChartHeight + y}px)`;
      overlayHorzRef.current.style.display = "block";

      let volData = param.seriesData.get(volumeSeries.current);

      if (!volData && data?.length) {
        const last = data[data.length - 1];
        volData = {
          value: Number(last.volume || last.v || last.k?.v || 0),
          close: last.close,
          open: last.open,
        };
      }

      if (volData) {
        const formatted =
          volData.value >= 1_000_000
            ? (volData.value / 1_000_000).toFixed(3) + "M"
            : (volData.value / 1_000).toFixed(3) + "K";

        const isBullish =
          data[data.length - 1]?.close >=
          data[data.length - 1]?.open;

        volumeLegendValue.textContent = `Volume ${formatted}`;
        volumeLegendValue.style.color =
          isBullish ? "#0ecb81" : "#f6465d";
      }
    });

    return () => {
      resizeObserver.disconnect();
      markersRef.current = null;
      priceChart.current.remove();
      volumeChart.current.remove();
    };
  }, []);



  useEffect(() => {
    if (!candleSeries.current) return;

    // Al vaciar (cambio de símbolo/intervalo) reseteamos el tracking y limpiamos
    // las series para no arrastrar estado del intervalo anterior.
    if (!data?.length) {
      lastLenRef.current = 0;
      lastFirstTimeRef.current = null;
      lastBarTimeRef.current = null;
      candleSeries.current.setData([]);
      volumeSeries.current.setData([]);
      return;
    }

    const first = data[0];
    const last = data[data.length - 1];

    const volumeBar = (c) => ({
      time: c.time,
      value: Number(c.volume || c.v || c.k?.v || 0),
      color:
        c.close >= c.open
          ? "rgba(14,203,129,0.5)"
          : "rgba(246,70,93,0.5)",
    });

    // ¿Es una actualización incremental de la última vela?
    // Ocurre cuando el array conserva su longitud y su primera vela, y solo
    // cambia la última (tick en vivo) o se agregó exactamente una vela nueva.
    const sameStart = lastFirstTimeRef.current === first.time;
    // Solo es update incremental si además el tiempo de la última vela no
    // retrocede (lightweight-charts exige orden ascendente en update()).
    const timeNotBackwards =
      lastBarTimeRef.current == null || last.time >= lastBarTimeRef.current;
    const isLiveUpdate =
      sameStart &&
      timeNotBackwards &&
      (data.length === lastLenRef.current ||
        data.length === lastLenRef.current + 1);

    let didLiveUpdate = false;
    if (isLiveUpdate) {
      try {
        // update() actualiza/appendea solo la última vela en O(1), sin redibujar todo.
        candleSeries.current.update({
          time: last.time,
          open: Number(last.open),
          high: Number(last.high),
          low: Number(last.low),
          close: Number(last.close),
        });
        volumeSeries.current.update(volumeBar(last));
        didLiveUpdate = true;
      } catch (e) {
        // Si el dato llega fuera de orden, caemos a redibujado completo.
        didLiveUpdate = false;
      }
    }

    if (!didLiveUpdate) {
      // Carga inicial / cambio de símbolo o intervalo / prepend de histórico:
      // redibujado completo (poco frecuente).
      earliestLoadedTimeRef.current = first.time;
      candleSeries.current.setData(data);
      volumeSeries.current.setData(data.map(volumeBar));
    }

    lastLenRef.current = data.length;
    lastFirstTimeRef.current = first.time;
    lastBarTimeRef.current = last.time;
  }, [data]);

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

  // Marcadores de señales ML. Va después del efecto de [data] para asignarse
  // sobre las velas ya cargadas. Solo las señales dentro del rango cargado (el
  // marcador debe coincidir con una vela existente). Se recalcula al cambiar
  // las señales, la selección o el rango, no en cada tick de la vela en curso.
  const firstTime = data?.[0]?.time;
  const lastTime = data?.length ? data[data.length - 1].time : undefined;
  useEffect(() => {
    if (!markersRef.current) return;
    if (firstTime == null) {
      markersRef.current.setMarkers([]);
      return;
    }
    markersRef.current.setMarkers(
      signals
        .map((s) => ({ ...s, time: Math.floor(s.ts / 1000) }))
        .filter((s) => s.time >= firstTime && s.time <= lastTime)
        .sort((a, b) => a.time - b.time)
        .map((s) => {
          const long = s.model === "long";
          const selected = s.time === selectedSignalTime;
          return {
            time: s.time,
            position: long ? "belowBar" : "aboveBar",
            shape: long ? "arrowUp" : "arrowDown",
            color: long ? SIGNAL_COLORS.long : SIGNAL_COLORS.short,
            size: selected ? 2 : 1,
            text: selected ? `${(s.prob * 100).toFixed(0)}%` : "",
          };
        })
    );
  }, [signals, selectedSignalTime, firstTime, lastTime]);

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
      <div ref={volumeChartRef} className="w-full h-[30%] relative" />
    </div>
  );
};

export default CandleChart;
