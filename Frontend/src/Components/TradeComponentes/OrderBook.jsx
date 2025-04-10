import React from 'react';

const OrderBook = () => {
  return (
    <div className="flex-1 h-[400px] ml-1 mr-1 bg-[#181A20] text-white  overflow-y-auto p-2 text-sm">
      {/* Encabezado */}
      <div className="text-sm font-medium mb-2 text-center pb-1">
        Order Book
      </div>

      {/* Contenido temporal */}
      <div className="text-xs space-y-1">
        <p className="text-gray-300">Ejemplo 1</p>
        <p className="text-gray-300">Ejemplo 2</p>
        <p className="text-gray-300">Ejemplo 3</p>
      </div>
    </div>
  );
};


export default OrderBook;
