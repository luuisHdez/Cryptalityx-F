import React, { useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import ChartDataProvider from "./ChartDataProvider";

const Main = () => {
  const location = useLocation();

  // 🔧 Definir estado para symbol e interval
  const [symbol, setSymbol] = useState("xrpusdt");
  const [interval, setInterval] = useState("1m");
  const [operationConfig, setOperationConfig] = useState(null);
  useEffect(() => {
    console.log(`📍 Ruta actual: ${location.pathname}`);

    if (location.pathname.startsWith("/trading")) {
      console.log("🟢 Conectando socket...");
      window.apiTrade.connectSocket();
      window.apiTrade.subscribeToSymbol(symbol, interval);
      window.apiTrade.listenToData((data) => {
        //console.log("📩 Datos recibidos desde socket:", data);
      });
      window.apiTrade.listeningOperationActivated((config) => {
        console.log("Main config:", config);
        setOperationConfig(config);
      });
    } else {
      console.log("🛑 Cerrando socket...");
      window.apiTrade.stopListening();
      window.apiTrade.disconnectSocket();
    }

    return () => {
      console.log("🧹 Cleanup socket desde Main");
      window.apiTrade.stopListening();
      window.apiTrade.disconnectSocket();
    };
  }, [location.pathname, symbol, interval]); // <- importante

  return (
    <>
      {location.pathname.startsWith("/trading") && (
        <div className="mt-2 relative z-10 shadow-lg">
          <ChartDataProvider
            symbol={symbol}
            interval={interval}
            setSymbol={setSymbol}
            setInterval={setInterval}
            operationConfig={operationConfig}
          />
        </div>
      )}
      <Outlet />
    </>
  );
};

export default Main;
