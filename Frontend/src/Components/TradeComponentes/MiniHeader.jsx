import React from "react";

const MiniHeader = ({ selectedView, setSelectedView, isMobile }) => {
  const baseTabs = ["chart", "info", "trading_data", "square"];
  const extraTabs = isMobile ? ["orderbook", "controls"] : [];

  const tabs = [...baseTabs, ...extraTabs];

  const labelMap = {
    chart: "Gráfica",
    info: "Info",
    trading_data: "Trading Data",
    square: "Square",
    orderbook: "Order Book",
    controls: "Controles",
  };

  return (
    <div className="flex flex-wrap bg-[#181A20] text-white text-sm">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setSelectedView(tab)}
          className={`px-4 py-2 whitespace-nowrap capitalize ${
            selectedView === tab ? "text-yellow-400 font-semibold" : "text-gray-400"
          }`}
        >
          {labelMap[tab]}
        </button>
      ))}
    </div>
  );
};

export default MiniHeader;
