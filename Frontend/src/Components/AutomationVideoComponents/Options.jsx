import React, { useState, useCallback, useEffect} from "react";
import { FiCalendar, FiDownload } from "react-icons/fi";
import { GoSync } from "react-icons/go";
import {
  fetchProfile,
  actualizarFechas,
  downloadVideo,
  updateLink,
  fetchDBPerfiles 
} from "../../APIAutomation/VideoAPI";
import { toast } from "react-toastify";

const Options = () => {
  const [newLink, setNewLink] = useState("");
  const [origenSeleccionado, setOrigenSeleccionado] = useState("");
  const [loading, setLoading] = useState(false);
  const [perfiles, setPerfiles] = useState([]);


  // Abstracción de validación
  const ensureOrigenSeleccionado = () => {
    if (!origenSeleccionado) {
      toast.error("❌ Debes seleccionar un origen válido (instagram o facebook).");
      return false;
    }
    return true;
  };

  const handleSubmitLink = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newLink.trim()) {
        toast.error("❌ El link no puede estar vacío");
        return;
      }
      try {
        setLoading(true);
        await updateLink(newLink);
        toast.success("✅ Link actualizado en Redis");
        setNewLink("");
      } catch (error) {
        toast.error(`❌ ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [newLink]
  );

  useEffect(() => {
    const loadPerfiles = async () => {
      try {
        const data = await fetchDBPerfiles();
        setPerfiles(data.perfiles || []);
      } catch (error) {
        toast.error("❌ Error al cargar perfiles");
      }
    };
  
    loadPerfiles();
  }, []);

  const handleSync = async () => {
    if (!ensureOrigenSeleccionado()) return;
    try {
      setLoading(true);
      const data = await fetchProfile(origenSeleccionado);
      toast.success(`✅ ${data.message}`);
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarFechas = async () => {
    if (!ensureOrigenSeleccionado()) return;
    try {
      setLoading(true);
      const data = await actualizarFechas(origenSeleccionado);
      toast.success(`✅ ${data.actualizados} fechas actualizadas`);
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!ensureOrigenSeleccionado()) return;
    try {
      setLoading(true);
      const data = await downloadVideo(origenSeleccionado);
      toast.success(`✅ Video descargado: ${data.file}`);
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLink = useCallback((e) => {
    setNewLink(e.target.value);
  }, []);

  return (
    <div>
      <div className="flex flex-col items-center space-y-6">
        {/* Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
          <Card
            title="Sync"
            subtitle="Update Data"
            Icon={GoSync}
            action={handleSync}
            disabled={loading}
          />
          <Card
            title="Date"
            subtitle="Match Upload Dates"
            Icon={FiCalendar}
            action={handleActualizarFechas}
            disabled={loading}
          />
          <Card
            title="Download"
            subtitle="Download on Local"
            Icon={FiDownload}
            action={handleDownloadVideo}
            disabled={loading}
          />
        </div>

        {/* Select */}
        <div className="w-full max-w-md">
        <BorderSelectUpdate
          value={origenSeleccionado}
          onChange={(e) => setOrigenSeleccionado(e.target.value)}
          placeholder="Selecciona Perfil"
          options={perfiles.map((perfil) => ({
            label: perfil,
            value: perfil
          }))}
        />

        </div>

        {/* Input + botón */}
        <div className="w-full max-w-md">
          <form
            onSubmit={handleSubmitLink}
            className="flex border border-blue-500 bg-neutral-900 rounded p-0"
          >
            <input
              type="text"
              value={newLink}
              onChange={handleChangeLink}
              placeholder="Perfil IG/FB..."
              className="w-full p-3 bg-transparent text-sm text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-l"
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-r transition-colors"
              disabled={loading}
            >
              {loading ? "Procesando..." : "Actualizar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, subtitle, Icon, action, disabled }) => (
  <button
    onClick={action}
    disabled={disabled}
    className={`w-full p-4 rounded border border-slate-700 relative overflow-hidden group bg-neutral-900 transition-transform ${
      disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
    }`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />
    <Icon className="absolute z-10 -top-12 -right-12 text-9xl text-slate-800 group-hover:text-blue-300 group-hover:rotate-12 transition-transform duration-300" />
    <Icon className="mb-2 text-2xl text-blue-500 group-hover:text-white transition-colors relative z-10 duration-300" />
    <h3 className="font-medium text-lg text-white group-hover:text-white relative z-10 duration-300">
      {title}
    </h3>
    <p className="text-slate-400 group-hover:text-blue-200 relative z-10 duration-300">
      {subtitle}
    </p>
  </button>
);

const BorderSelectUpdate = ({ options = [], placeholder, value, onChange }) => (
  <div className="relative w-full">
    <select
      className="w-full p-3 pr-10 rounded border border-blue-500 bg-neutral-900 text-white placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
      value={value}
      onChange={onChange}
    >
      <option value="" disabled hidden>
        {placeholder}
      </option>
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg
        className="h-4 w-4 text-blue-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

export default Options;
