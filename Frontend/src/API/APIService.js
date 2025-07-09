import axios from "axios"; 
import { refreshToken } from "../API/auth.api"; // ajusta la ruta si es distinto


const api = axios.create({
  baseURL: "http://localhost:8001",
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      try {
        await refreshToken(); // llama al backend Django
        return api(error.config); // reintenta la solicitud
      } catch (err) {
        console.error("❌ Falló refreshToken:", err);
        window.location.href = "/login";
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
        withCredentials: false,
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
    const startTimestamp = new Date(startDate).getTime() + 21600000;; // en ms
    const endTimestamp = new Date(endDate).getTime() + 21600000;;     // en ms

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

export const submitOperationConfig = async (symbol, toolStates) => {
    console.log(toolStates)
    try {
      const payload = {
        symbol: symbol.toUpperCase(),
        alert_up: toolStates.AU?.value,
        alert_down: toolStates.AD?.value,
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
      withCredentials: false,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en fetchUpdatedData:", error.response?.data || error);
    return [];
  }
};
