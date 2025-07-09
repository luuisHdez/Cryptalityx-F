// src/API/trade_api.js
import { io } from "socket.io-client";

// Conexión manual al backend Socket.IO (sin fallback y sin autoconectar)
const socket = io("http://localhost:8001", {
  transports: ["websocket"],
  autoConnect: false, // 🔧 Requiere llamada explícita a .connect()
  withCredentials: true
});
// 🔁 Reintento automático si el JWT está expirado
import { refreshToken } from "../API/auth.api"; // asegúrate que esto ya existe

socket.on("connect_error", async (err) => {
  if (err?.reason === "token expired") {
    console.warn("⚠️ JWT expirado. Intentando refrescar...");
    try {
      await refreshToken();     // intenta refrescar el token
      socket.connect();         // reconecta automáticamente
    } catch (e) {
      console.error("❌ Falló refreshToken tras expiración:", e);
      window.location.href = "/login";  // fuerza login si falla
    }
  }
});


// Conecta si no está conectado
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

// Desconecta si está conectado
export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

// Suscribirse a un símbolo/intervalo
export const subscribeToSymbol = (symbol, interval) => {
  socket.emit("subscribe", { symbol, interval });
};

// Escuchar datos emitidos por el servidor
export const listenToData = (callback) => {
  socket.on("binance_data", callback);
};

export const listeningOperationActivated = (callback) => {
  socket.on("operation_executed", callback);
};

// Dejar de escuchar
export const stopListening = () => {
  socket.off("binance_data");
};

// Exponer en consola para pruebas
if (typeof window !== "undefined") {
  window.apiTrade = {
    connectSocket,
    disconnectSocket,
    subscribeToSymbol,
    listenToData,
    stopListening,
    listeningOperationActivated
  };
}
