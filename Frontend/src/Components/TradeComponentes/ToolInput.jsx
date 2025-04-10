import React from "react";

const ToolInput = ({ label, value, setValue, disabled = false }) => {
  const handleChange = (e) => {
    const newVal = parseFloat(parseFloat(e.target.value).toFixed(4));
    if (!isNaN(newVal)) setValue(newVal);
  };

  return (
    <div className="bg-[#181A20] text-white p-2 w-full h-auto ">      
      <label className="text-white text-sm  mb-1 capitalize">
        {label.replace("_", " ")}
      </label>
      <input
        type="number"
        value={value || ""}
        onChange={handleChange}
        step="0.0001"
        placeholder="0.0"
        disabled={disabled}
        className="w-full max-w-[100px] p-1 rounded bg-gray-900 text-white border border-gray-600 text-sm"
      />
    </div>
  );
};

export default ToolInput;
