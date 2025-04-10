import axios from "axios"; 

const API_URL = "http://localhost:8001"; // Asegúrate de que coincida con el host de tu backend FastAPI

export const fetchHistoricalData = async (symbol, interval) => {
    if (!symbol || !interval) {
        console.warn("⚠️ No se puede cargar datos históricos: symbol o interval indefinidos.");
        return [];
    }

    try {
        const response = await axios.get(`${API_URL}/historical-data/${symbol}/${interval}`, {
            withCredentials: false,
        });

        if (!response.data || response.data.length === 0) {
            console.warn(`⚠️ No hay datos históricos para ${symbol} en ${interval}.`);
            return [];
        }

        // Se asume que 'candle.time' ya está en segundos (1 minuto de diferencia)
        return response.data.map((candle) => ({
            time: Number(candle.time),
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
            volume: Number(candle.volume),
        }));
    } catch (error) {
        if (error.response?.status === 404) {
            console.warn(`⚠️ No se encontraron datos históricos para ${symbol} en ${interval}.`);
        } else {
            console.error("⚠️ Error al cargar datos históricos:", error);
        }
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
        const response = await axios.get(`${API_URL}/update-binance-data/`, {
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
        entry_point: toolStates.EPt?.value,
        alert_up: toolStates.AU?.value,
        alert_down: toolStates.AD?.value,
      };
  
      const response = await axios.post(`${API_URL}/operation-config`, payload);
      return response.data;
    } catch (error) {
      console.error("❌ Error al enviar configuración:", error.response?.data || error);
      throw error;
    }
  };
  