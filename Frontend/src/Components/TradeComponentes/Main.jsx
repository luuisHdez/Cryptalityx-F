import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import ChartDataProvider from "./ChartDataProvider";

const Main = () => {
  const location = useLocation();
  const [symbol, setSymbol] = useState("xrpusdt");
  const [interval, setInterval] = useState("15m");

  return (
    <>
      {location.pathname.startsWith("/trading") && (
        <div className="mt-2 relative z-10 shadow-lg flex flex-col h-[calc(100vh-64px)]">
          <ChartDataProvider
            symbol={symbol}
            interval={interval}
            setSymbol={setSymbol}
            setInterval={setInterval}
          />
        </div>

      )}
      <Outlet />
    </>
  );
};

export default Main;
