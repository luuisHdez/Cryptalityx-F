import React from "react";

const ToolInput = ({ label, value, setValue, disabled = false }) => {
  const handleChange = (e) => {
    const newVal = parseFloat(parseFloat(e.target.value).toFixed(4));
    if (!isNaN(newVal)) setValue(newVal);
  };

  return (
    <div className="bg-[#181A20] text-white p-1 min-w-[110px] flex flex-col items-start">   
      <label className="text-white text-xs mb-0.5 capitalize">
        {label.replace("_", " ")}
      </label>
      <input
        type="number"
        value={value || ""}
        onChange={handleChange}
        step="0.0001"
        placeholder=""
        disabled={disabled}
        className="w-full p-1 rounded bg-gray-900 text-white border border-blue-800 text-xs"
      />
    </div>
  );
};

export default ToolInput;
