import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, CrosshairMode, createSeriesMarkers } from "lightweight-charts";
import { fetchBacktestCandles } from "../../API/APIService";
import { formatAxisTime, formatSecondsDisplay, isLong } from "./analyticsFormat";

// Color de las flechas de señal: long verde, short rojo.
const SIGNAL_COLORS = { long: "#0ecb81", short: "#f6465d" };

// Gráfica de velas del tramo de evaluación con una flecha por señal, en la vela
// de decisión. La señal seleccionada se agranda y la gráfica se centra en ella.
const SignalsChart = ({ runId, model, signals, barSeconds, selectedTs, onSelectSignal }) => {
  // Short: flecha hacia abajo sobre la vela. Long: flecha hacia arriba bajo la vela.
  const long = isLong(model);
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const markersRef = useRef(null);
  const signalsRef = useRef(signals);
  const onSelectRef = useRef(onSelectSignal);
  const [candleCount, setCandleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  signalsRef.current = signals;
  onSelectRef.current = onSelectSignal;

  // 1. Crear la gráfica una sola vez.
  useEffect(() => {
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: "#0b0e11" }, textColor: "#eaecef", fontSize: 12 },
      grid: { vertLines: { color: "#1e2026" }, horzLines: { color: "#1e2026" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { minimumWidth: 70 },
      timeScale: { timeVisible: true, secondsVisible: false, tickMarkFormatter: formatAxisTime },
      localization: { timeFormatter: formatSecondsDisplay },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#0ecb81",
      downColor: "#f6465d",
      wickUpColor: "#0ecb81",
      wickDownColor: "#f6465d",
      borderVisible: false,
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });
    const markers = createSeriesMarkers(series, []);

    // Clic sobre la vela de una señal -> seleccionarla.
    chart.subscribeClick((param) => {
      if (typeof param?.time !== "number") return;
      const hit = signalsRef.current.find((s) => Math.floor(s.ts / 1000) === param.time);
      if (hit) onSelectRef.current?.(hit.ts);
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = markers;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // 2. Cargar las velas de la corrida.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCandleCount(0);
    seriesRef.current?.setData([]);

    fetchBacktestCandles(runId)
      .then((data) => {
        if (cancelled || !seriesRef.current) return;
        seriesRef.current.setData(data);
        chartRef.current.timeScale().fitContent();
        setCandleCount(data.length);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "No se pudieron cargar las velas");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  // 3. Marcadores: solo dónde hubo señal, un mismo color. La seleccionada (clic
  //    en la flecha o en la tabla) se agranda y muestra la probabilidad del modelo.
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.setMarkers(
      signals.map((s) => {
        const selected = s.ts === selectedTs;
        return {
          time: Math.floor(s.ts / 1000),
          position: long ? "belowBar" : "aboveBar",
          shape: long ? "arrowUp" : "arrowDown",
          color: long ? SIGNAL_COLORS.long : SIGNAL_COLORS.short,
          size: selected ? 2 : 1,
          text: selected ? `${(s.prob * 100).toFixed(0)}%` : "",
        };
      })
    );
  }, [signals, selectedTs, candleCount, long]);

  // 4. Centrar la gráfica en la señal seleccionada.
  useEffect(() => {
    if (!selectedTs || !candleCount || !chartRef.current) return;
    const t = Math.floor(selectedTs / 1000);
    chartRef.current.timeScale().setVisibleRange({ from: t - 80 * barSeconds, to: t + 40 * barSeconds });
  }, [selectedTs, candleCount, barSeconds]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-[420px] rounded-md overflow-hidden border border-[#2b3139]" />

      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#131722]/90 border border-[#2b3139] rounded px-3 py-1.5 text-[11px] text-[#eaecef]">
        <span aria-hidden="true" style={{ color: long ? SIGNAL_COLORS.long : SIGNAL_COLORS.short }}>{long ? "▲" : "▼"}</span>
        Señal ({signals.length}) · clic para ver la probabilidad del modelo
      </div>

      {(loading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e11]/70 text-sm" role="status">
          {error ? <span className="text-[#f6465d]">{error}</span> : <span className="text-[#848e9c]">Cargando velas…</span>}
        </div>
      )}
    </div>
  );
};

export default SignalsChart;
