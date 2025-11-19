// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket] = useState(() =>
    io("https://localhost:8001", {
      autoConnect: false,
      withCredentials: true,   // las cookies HTTP-Only se envían solas
      transports: ["websocket"],
    })
  );

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      console.log("🔌 Socket conectado desde contexto");
    }

    socket.on("connect_error", (err) => console.error("❌ Error socket:", err));
    socket.on("disconnect", (reason) => console.warn("❌ Desconectado:", reason));

    return () => {
      socket.disconnect();
      console.log("🧹 Socket desconectado contexto");
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
