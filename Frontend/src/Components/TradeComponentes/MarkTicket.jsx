import React, { useRef, useEffect, useState } from "react";

const MarkTicket = ({ price, symbol }) => {
  const prevPrice = useRef(null);
  const [color, setColor] = useState("text-white");

  useEffect(() => {
    if (prevPrice.current !== null) {
      if (price > prevPrice.current) {
        setColor("text-green-500");
      } else if (price < prevPrice.current) {
        setColor("text-red-500");
      }
    }
    prevPrice.current = price;
  }, [price]);

  return (
     <div className="w-full h-full flex items-center justify-center rounded-md shadow-inner px-2">
    <span className="text-white text-base lg:text-lg font-medium tracking-wide uppercase">{symbol}:</span>
    <span className={`ml-2 text-base lg:text-lg font-bold ${color} transition-colors duration-300`}>
      {price ?? "—"}
    </span>
  </div>

  );
};

export default MarkTicket;
