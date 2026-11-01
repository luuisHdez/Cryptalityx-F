// ✅ Este archivo NO crea su propio socket
// Solo define funciones que reciben el socket como argumento

// Emitir suscripción a un símbolo e intervalo
export const subscribeToSymbol = (socket, symbol, interval) => {
  if (socket && socket.connected && socket.emit) {
    console.log("📡 Enviando suscripción:", { symbol, interval });
    socket.emit("subscribe", { symbol, interval });
  } else {
    console.warn("❌ Socket no disponible o no conectado para subscribeToSymbol");
  }
};

// Escuchar datos emitidos por el servidor (velas en tiempo real)
export const listenToData = (socket, callback) => {
  if (socket && socket.on) {
    socket.off("binance_data"); // 🔄 Previene listeners duplicados
    socket.on("binance_data", callback);
    console.log("👂 Listener registrado: binance_data");
  } else {
    console.warn("❌ Socket no disponible o no soporta eventos para listenToData");
  }
};

// Escuchar ejecución de operación (operation_executed)
export const listeningOperationActivated = (socket, callback) => {
  if (socket && socket.on) {
    socket.off("operation_executed");
    socket.on("operation_executed", callback);
    console.log("👂 Listener registrado: operation_executed");
  } else {
    console.warn("❌ Socket no disponible o no soporta eventos para listeningOperationActivated");
  }
};

// Escuchar señales de los modelos ML (ml_signal)
export const listenToSignals = (socket, callback) => {
  if (socket && socket.on) {
    socket.off("ml_signal");
    socket.on("ml_signal", callback);
    console.log("👂 Listener registrado: ml_signal");
  } else {
    console.warn("❌ Socket no disponible o no soporta eventos para listenToSignals");
  }
};

// Detener todos los listeners activos
export const stopListening = (socket) => {
  if (socket && socket.off) {
    socket.off("binance_data");
    socket.off("operation_executed");
    socket.off("ml_signal");
    console.log("🛑 Listeners eliminados: binance_data, operation_executed, ml_signal");
  } else {
    console.warn("❌ Socket no disponible o no soporta eventos para stopListening");
  }
};

// (Opcional) Exponer para pruebas desde consola del navegador
if (typeof window !== "undefined") {
  window.apiTradeUtils = {
    subscribeToSymbol,
    listenToData,
    listenToSignals,
    stopListening,
    listeningOperationActivated,
  };
}
