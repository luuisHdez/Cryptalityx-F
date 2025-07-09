import React, { useState, useEffect } from "react";
import { editVideo } from "../../APIAutomation/VideoAPI";
import { toast } from "react-toastify";
import BarLoader from "./BarLoader";
import SocialButtons from "./SocialButtons";

const EditOptions = ({ selectedVideo }) => {
  const [form, setForm] = useState({
    filename: selectedVideo || "",
    speed: "", margin: "", color_factor: "",
    rotate_angle: "", lum: "", contrast: "",
    contrast_thr: "", text: "", fade: "",
    animate: false, blurred_margin: false, emoji_name: ""
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const filenameWithParams = selectedVideo?.split("/").pop() || "";
  const filename = filenameWithParams.split("?")[0]; // Elimina query params
  setForm((prev) => ({ ...prev, filename }));
}, [selectedVideo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await editVideo({ ...form, filename: form.filename.trim() });
      toast.success("✅ Video editado correctamente");
      setForm((prev) => ({
        filename: prev.filename,
        speed: "",
        margin: "",
        color_factor: "",
        rotate_angle: "",
        lum: "",
        contrast: "",
        contrast_thr: "",
        text: "",
        fade: "",
        animate: false,
        blurred_margin: false,
        emoji_name: "",
      }));
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[350px] bg-neutral-900 border border-slate-700 text-white text-[11px] rounded p-2 flex flex-col">
      {loading && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center rounded">
          <BarLoader />
        </div>
      )}

      {/* Form ocupa 2/3 del contenedor */}
      <div className="lex-2 basis-1/3 min-h-[135px] max-h-full overflow-y-visible overflow-x-hidden">
        <form
          onSubmit={handleSubmit}
          className={`flex flex-col gap-1 ${loading ? "opacity-90 pointer-events-none" : ""}`}
        >
          {/* Línea 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="sm:col-span-2 flex flex-col">
              <label className="text-blue-300">Archivo</label>
              <input
                type="text"
                name="filename"
                value={form.filename}
                readOnly
                onChange={handleChange}
                required
                className="w-full px-2 py-0.5 bg-neutral-800 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-1 flex flex-col">
              <label className="text-blue-300">Emoji</label>
              <select
                name="emoji_name"
                value={form.emoji_name}
                onChange={handleChange}
                className="w-full py-0.5 bg-neutral-800 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500 text-[10px]"
              >
                <option value="">Selecciona un emoji</option>
                <option value="besito">besito</option>
                <option value="enamorado">enamorado</option>
                <option value="risa">risa</option>
                <option value="calor">calor</option>
                <option value="sorprendido">sorprendido</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex flex-col">
              <label className="text-blue-300">Texto</label>
              <input
                type="text"
                name="text"
                value={form.text}
                onChange={handleChange}
                className="w-full px-2 py-0.5 bg-neutral-800 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Línea 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-10 gap-1 items-end">
            {[
              { label: "Speed", name: "speed" },
              { label: "Margin", name: "margin" },
              { label: "Color", name: "color_factor" },
              { label: "Rotar", name: "rotate_angle" },
              { label: "Fade", name: "fade" },
              { label: "Lum", name: "lum" },
              { label: "Contraste", name: "contrast" },
              { label: "Umbral", name: "contrast_thr" }
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col items-start">
                <label className="text-blue-300">{label}</label>
                <input
                  type="number"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-14 px-1 py-0.5 bg-neutral-800 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}

            {/* Checkboxes */}
            <div className="flex flex-col justify-start mt-4 col-span-2 sm:col-span-2 gap-1">
              <label className="flex items-center text-blue-300">
                <input
                  type="checkbox"
                  name="animate"
                  checked={form.animate}
                  onChange={handleChange}
                  className="accent-blue-500 mr-1"
                />
                Animar
              </label>
              <label className="flex items-center text-blue-300">
                <input
                  type="checkbox"
                  name="blurred_margin"
                  checked={form.blurred_margin || false}
                  onChange={handleChange}
                  className="accent-blue-500 mr-1"
                />
                Fondo borroso (short)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="relative overflow-hidden w-full mt-1 rounded-lg border border-slate-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#1e3a8a] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none group"
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-600 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
            <span className="relative z-10">Editar</span>
          </button>
        </form>
      </div>

      {/* Botones sociales */}
      <div className="pt-3">
        <SocialButtons filename={form.filename} />
      </div>
    </div>
  );
};

export default EditOptions;
