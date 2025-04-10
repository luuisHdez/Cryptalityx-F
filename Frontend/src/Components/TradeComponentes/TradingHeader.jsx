import React from 'react';
import ChartControls from './ChartControls';

const TradingHeader = () => {
  return (
    <>
    <div className="flex relative px-4 h-full w-full items-center justify-start flex-nowrap border-b border-gray-300 bg-[#212121]">
      {/* Sección izquierda: ícono, título y link */}
      <div className="flex items-center flex-shrink-0">
        <div>
          <h1 className="text-xl font-medium leading-6 m-0 text-white">
            XRP/USDT
          </h1>
          <a
            href="#"
            className="text-[12px] no-underline text-[#007bff] flex items-center"
          >
            {/* Aquí se podría agregar texto o ícono adicional */}
          </a>
        </div>
      </div>
      {/* Sección derecha: Datos del ticker */}
      <div className="ml-auto flex items-center gap-4">
        {/* Aquí se agregarán datos del ticker */}
      </div>
    </div>
    <ChartControls />
    </>
    
  );
};

export default TradingHeader;
