import axios from "axios"; 
import { refreshToken } from "../API/auth.api"; // ajusta la ruta si es distinto


const api = axios.create({
  baseURL: `https://${window.location.hostname}:8001`,
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    // Reintenta el refresh una sola vez por petición para evitar bucles infinitos.
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshToken(); // llama al backend Django
        return api(originalRequest); // reintenta la solicitud original una vez
      } catch (err) {
        console.error("❌ Falló refreshToken:", err);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);


export const fetchHistoricalData = async (symbol, interval, before = null) => {
  console.log("➡️ fetchHistoricalData", { symbol, interval, before });
    if (!symbol || !interval) {
      console.warn("⚠️ No se puede cargar datos históricos: symbol o interval indefinidos.");
      return [];
    }
  
    try {
      const params = before ? { params: { before } } : {};
      const response = await api.get(`/historical-data/${symbol}/${interval}`, {
        ...params,
      });
  
      if (!response.data || response.data.length === 0) {
        console.warn(`⚠️ No hay datos históricos para ${symbol} en ${interval}.`);
        return [];
      }
  
      return response.data.map((candle) => ({
        time: Number(candle.time),
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        volume: Number(candle.volume),
      }));
    } catch (error) {
      console.error("⚠️ Error al cargar datos históricos:", error);
      return [];
    }
  };
  

// ✅ NUEVA función para consumir /update-binance-data/
export const updateBinanceData = async (startDate, endDate, symbol) => {
    const startTimestamp = new Date(startDate).getTime(); // UTC puro
const endTimestamp = new Date(endDate).getTime();     // UTC puro


    if (!symbol || isNaN(startTimestamp) || isNaN(endTimestamp)) {
        console.warn("⚠️ Parámetros inválidos para actualizar datos.");
        return null;
    }

    try {
        const response = await api.get(`/update-binance-data/`, {
            params: {
                symbol: symbol.toUpperCase(),
                start_time: startTimestamp,
                end_time: endTimestamp,
            },
        });

        return response.data;
    } catch (error) {
        console.error("❌ Error al actualizar datos de Binance:", error.response?.data || error);
        return null;
    }
};

export const submitOperationConfig = async (symbol, values) => {
    console.log(values)
    try {
      const payload = {
        symbol: symbol.toUpperCase(),
        ...values
      };
  
      const response = await api.post(`/operation-config`, payload);
      return response.data;
    } catch (error) {
      console.error("❌ Error al enviar configuración:", error.response?.data || error);
      throw error;
    }
  };
  
export const fetchUpdatedData = async (symbol, interval) => {
  if (!symbol || !interval) {
    console.warn("⚠️ Symbol o interval no definidos para fetchUpdatedData.");
    return [];
  }

  try {
    const response = await api.get(`/update-then-fetch/${symbol}/${interval}`, {
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en fetchUpdatedData:", error.response?.data || error);
    return [];
  }
};


// 🔴 Detener operación activa para un símbolo
export const stopOperation = async (symbol) => {
  try {
    const payload = { symbol: symbol.toUpperCase() };
    const response = await api.post(`/stop-operation`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error al detener operación:", error.response?.data || error);
    throw error;
  }
};

// 📊 Enviar configuración de alertas de indicadores
export const submitIndicatorAlertConfig = async (symbol, config) => {
  try {
    const payload = {
      symbol: symbol.toUpperCase(),
      ...config,
    };
    const response = await api.post('/indicator-alert-config', payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error al enviar config de alertas de indicadores:", error.response?.data || error);
    throw error;
  }
};


// 🔄 Sincronizar posición abierta desde Binance
export const syncPosition = async (symbol) => {
  try {
    const payload = { symbol: symbol.toUpperCase() };
    const response = await api.post('/sync-position', payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error al sincronizar posición:", error.response?.data || error);
    throw error;
  }
};


// 📋 Obtener historial de órdenes desde Binance
export const fetchOrderHistory = async (symbol, period = "1d") => {
  try {
    const response = await api.get(`/order-history`, {
      params: { symbol: symbol.toUpperCase(), period },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener historial de órdenes:", error.response?.data || error);
    return [];
  }
};



// ============================================================================
// FUTUROS USDT-M — Panel de trading (feature futures-trading-panel)
// Estas funciones consumen los endpoints de futuros.
// ============================================================================

// 🟢/🔴 Abrir posición de futuros LONG/SHORT a mercado
export const openFuturesPosition = async (symbol, side, amountUsdt, leverage, marginMode) => {
  try {
    const payload = {
      symbol: symbol.toUpperCase(),
      side,                    // "LONG" | "SHORT"
      amount_usdt: Number(amountUsdt),
      leverage: Number(leverage),
      margin_mode: marginMode, // "CROSSED" | "ISOLATED"
    };
    const response = await api.post(`/futures/open-position`, payload);
    return response.data;
  } catch (error) {
    // Propaga el detalle del backend (msg de Binance) para mostrarlo al usuario.
    const detail = error.response?.data?.detail || error.message;
    throw new Error(detail);
  }
};

// ❌ Cerrar la posición de futuros abierta
export const closeFuturesPosition = async (symbol) => {
  try {
    const payload = { symbol: symbol.toUpperCase() };
    const response = await api.post(`/futures/close-position`, payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    throw new Error(detail);
  }
};

// ℹ️ Filtros del símbolo (step_size, min_qty, min_notional, max_leverage, price)
export const fetchFuturesSymbolInfo = async (symbol) => {
  try {
    const response = await api.get(`/futures/symbol-info`, {
      params: { symbol: symbol.toUpperCase() },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener symbol-info de futuros:", error.response?.data || error);
    return null;
  }
};


// ============================================================================
// ANALYTICS — corridas de backtest guardadas por el laboratorio (backtest_runs)
// Especificación: Tb-AI_M/ANALYTICS_BACKTESTS.md (Fase 3/4)
// ============================================================================

// 📋 Lista de corridas (sin imagen, código ni señales). Filtros opcionales.
export const fetchBacktests = async ({ model, interval, review_status } = {}) => {
  const params = {};
  if (model) params.model = model;
  if (interval) params.interval = interval;
  if (review_status) params.review_status = review_status;
  const response = await api.get(`/backtests`, { params });
  return response.data;
};

// 🔎 Detalle de una corrida (incluye señales, código y la corrida anterior).
export const fetchBacktest = async (id) => {
  const response = await api.get(`/backtests/${id}`);
  return response.data;
};

// 🤖 Señales en vivo (long/short) del rango [fromMs, toMs] para el símbolo e intervalo.
export const fetchLiveSignals = async (symbol, interval, fromMs, toMs = null) => {
  try {
    const params = { from_ms: Math.max(0, Math.floor(fromMs)) };
    if (toMs != null) params.to_ms = Math.floor(toMs);
    const response = await api.get(`/live-signals/${symbol.toUpperCase()}/${interval}`, { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener señales en vivo:", error.response?.data || error);
    return [];
  }
};

// ✈️ Vinculación de Telegram con el usuario actual (la usa el bot).
export const fetchTelegramLink = async () => {
  const response = await api.get("/telegram-link");
  return response.data;
};

export const saveTelegramLink = async (telegramId) => {
  const response = await api.post("/telegram-link", { telegram_id: telegramId });
  return response.data;
};

export const deleteTelegramLink = async () => {
  const response = await api.delete("/telegram-link");
  return response.data;
};

// 🕯️ Velas del tramo de evaluación, resampleadas al intervalo de la corrida.
export const fetchBacktestCandles = async (id) => {
  const response = await api.get(`/backtests/${id}/candles`);
  return response.data;
};

// 🖼️ Imagen PNG de respaldo. Devuelve un object URL (revocar al cerrar).
export const fetchBacktestImageUrl = async (id) => {
  const response = await api.get(`/backtests/${id}/image`, { responseType: "blob" });
  return URL.createObjectURL(response.data);
};

// 🧪 Valores iniciales para una nueva prueba (última corrida del mismo modelo e intervalo).
export const fetchBacktestDefaults = async (model, interval) => {
  const response = await api.get("/backtest-jobs/defaults", { params: { model, interval } });
  return response.data;
};

// ▶️ Lanzar un backtest del laboratorio con la config y los hiperparámetros del formulario.
export const startBacktestJob = async ({ model, interval, config, hyperparams }) => {
  const response = await api.post("/backtest-jobs", { model, interval, config, hyperparams });
  return response.data;
};

// ⏳ Estado de la corrida lanzada desde el front.
export const fetchBacktestJob = async () => {
  const response = await api.get("/backtest-jobs/current");
  return response.data;
};

// 📝 Guardar la revisión manual de una corrida.
export const updateBacktestReview = async (id, reviewStatus, reviewNotes) => {
  try {
    const response = await api.patch(`/backtests/${id}/review`, {
      review_status: reviewStatus,
      review_notes: reviewNotes || null,
    });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    throw new Error(typeof detail === "string" ? detail : "No se pudo guardar la revisión");
  }
};
