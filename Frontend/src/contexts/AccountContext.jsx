// src/contexts/AccountContext.jsx
// Fuente ÚNICA de balance/posición en el frontend.
// Escucha el evento 'position_update' del backend (una sola vez) y expone
// el balance USDT y la posición abierta a todos los componentes, evitando
// que cada uno llame a /account-balance por su cuenta.
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";

const AccountContext = createContext({ usdtAvailable: 0, position: null });

export const AccountProvider = ({ children }) => {
  const { socket } = useSocket();
  const [usdtAvailable, setUsdtAvailable] = useState(0);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (data) => {
      setUsdtAvailable(data?.usdt_available ?? 0);
      setPosition(data?.position ?? null);
    };
    socket.on("position_update", onUpdate);
    return () => {
      socket.off("position_update", onUpdate);
    };
  }, [socket]);

  return (
    <AccountContext.Provider value={{ usdtAvailable, position }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => useContext(AccountContext);
