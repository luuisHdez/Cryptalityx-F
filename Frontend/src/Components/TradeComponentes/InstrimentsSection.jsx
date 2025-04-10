import React from 'react';
import { Link } from 'react-router-dom';

const InstrumentsSection = () => {
  return (
    <div className="mx-auto max-w-screen-xl bg-white text-black px-12 py-6">
      {/* Encabezado general centrado */}
      <div className="mb-6 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">43 Pares de divisas</h2>
        <div className="flex justify-center space-x-10">
          <div className="text-center">
            <div className="text-lg font-bold">$10</div>
            <div className="text-sm text-gray-600">Depósito mínimo</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">$1</div>
            <div className="text-sm text-gray-600">Inversión mínima</div>
          </div>
        </div>
      </div>

      {/* Cabecera de "tabla" usando grid responsive */}
      <div className="grid gap-4 border-b border-gray-200 pb-2 mb-2 text-sm font-semibold 
                      grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <div>Nombre</div>
        <div className="hidden md:block">Rentabilidad hasta</div>
        <div className="hidden xl:block">Bid</div>
        <div className="hidden xl:block">Ask</div>
        <div className="hidden lg:flex">Cambio 1D</div>
        <div>Acciones</div>
      </div>

      {/* Filas de datos */}
      <div className="space-y-2">
        {/* Fila de ejemplo: EUR/USD */}
        <div className="grid gap-4 items-center border-b border-gray-100 hover:bg-gray-50 py-2 text-sm
                        grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {/* Nombre */}
          <div>
            <div className="flex items-center space-x-2">
              <img
                src="https://via.placeholder.com/24"
                alt="EUR/USD"
                className="w-6 h-6"
              />
              <div>
                <div className="font-medium">EUR/USD</div>
                <div className="text-xs text-gray-500">EURUSD</div>
              </div>
            </div>
          </div>
          {/* Rentabilidad hasta */}
          <div className="hidden md:block">Ilimitado</div>
          {/* Bid */}
          <div className="hidden xl:block">1.061270</div>
          {/* Ask */}
          <div className="hidden xl:block">1.061290</div>
          {/* Cambio 1D */}
          <div className="hidden lg:flex items-center">
            <span className="text-green-600 font-medium mr-2">+0.44%</span>
            <svg width="60" height="20" className="inline-block">
              <path
                d="M0,10 L10,8 L20,12 L30,6 L40,14 L50,8 L60,10"
                stroke="green"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
          {/* Acciones */}
          <div>
            <div className="flex space-x-2">
              <button className="bg-red-100 text-red-600 px-2 py-1 text-xs">Vender</button>
              <button className="bg-green-100 text-green-600 px-2 py-1 text-xs">Comprar</button>
            </div>
          </div>
        </div>

        {/* Fila de ejemplo: USD/JPY; al presionarla redirige a /trading/charts */}
        <Link to="/trading/charts" className="no-underline">
          <div className="grid gap-4 items-center border-b border-gray-100 hover:bg-gray-50 py-2 text-sm
                          grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <div>
              <div className="flex items-center space-x-2">
                <img
                  src="https://via.placeholder.com/24"
                  alt="USD/JPY"
                  className="w-6 h-6"
                />
                <div>
                  <div className="font-medium">USD/JPY</div>
                  <div className="text-xs text-gray-500">USDJPY</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">Ilimitado</div>
            <div className="hidden xl:block">149.1250</div>
            <div className="hidden xl:block">149.1300</div>
            <div className="hidden lg:flex items-center">
              <span className="text-red-600 font-medium mr-2">-0.99%</span>
              <svg width="60" height="20" className="inline-block">
                <path
                  d="M0,15 L10,10 L20,12 L30,6 L40,14 L50,12 L60,15"
                  stroke="red"
                  fill="none"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <div className="flex space-x-2">
                <button className="bg-red-100 text-red-600 px-2 py-1 text-xs">Vender</button>
                <button className="bg-green-100 text-green-600 px-2 py-1 text-xs">Comprar</button>
              </div>
            </div>
          </div>
        </Link>

        {/* Agrega más filas dinámicamente */}
      </div>
    </div>
  );
};

export default InstrumentsSection;
