import React, { useEffect, useState } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { FaMedal } from "react-icons/fa";
import { fetchDBVideos } from "../../APIAutomation/VideoAPI";

// --- Funciones para guardar/leer localStorage con expiración ---
const setWithExpiry = (key, value, ttlMinutes = 10) => {
  const now = new Date();
  const item = {
    value,
    expiry: now.getTime() + ttlMinutes * 60 * 1000,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (err) {
    localStorage.removeItem(key);
    return null;
  }
};

// --- Estilos para el estado ---
const getStatusStyle = (status) => {
  const base = "px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ";
  switch (status) {
    case "descargado":
      return base + "bg-green-200 text-green-800";
    case "pendiente":
      return base + "bg-yellow-200 text-yellow-800";
    case "subido":
      return base + "bg-blue-200 text-blue-800";
    default:
      return base + "bg-slate-200 text-slate-800";
  }
};

const TeamTable = () => {
  const [videos, setVideos] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // Cargar filtro desde localStorage (si no expiró)
  useEffect(() => {
    const savedFiltro = getWithExpiry("estadoFiltro");
    if (savedFiltro) {
      setEstadoFiltro(savedFiltro);
    }
  }, []);

  // Cargar datos
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDBVideos();
        setVideos(data);
      } catch (error) {
        console.error("❌ Error al cargar videos:", error.message);
      }
    };
    load();
  }, []);

  const handleFiltroChange = (e) => {
    const nuevoEstado = e.target.value;
    setEstadoFiltro(nuevoEstado);
    setWithExpiry("estadoFiltro", nuevoEstado); // ✅ guarda con expiración
    setPage(0);
  };

  const videosFiltrados =
    estadoFiltro === "todos"
      ? videos
      : videos.filter((v) => v.estado === estadoFiltro);

  const paginated = videosFiltrados.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.max(1, Math.ceil(videosFiltrados.length / perPage));

  return (
    <div className="w-full bg-neutral-900 border border-slate-700 shadow-sm overflow-x-auto text-white text-xs">
      {/* Header de controles */}
      <div className="flex flex-wrap items-center justify-between px-2 py-1 gap-2 bg-neutral-800 border-b border-slate-700">
        <label className="text-xs text-gray-400">
          Mostrar{" "}
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(0);
            }}
            className="bg-neutral-800 border border-gray-600 text-white px-1 py-0.5 text-xs rounded ml-2"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>{" "}
          registros
        </label>

        <label className="text-xs text-gray-400">
          Estado{" "}
          <select
            value={estadoFiltro}
            onChange={handleFiltroChange}
            className="bg-neutral-800 border border-gray-600 text-white px-1 py-0.5 text-xs rounded ml-2"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="descargado">Descargado</option>
            <option value="subido">Subido</option>
          </select>
        </label>

        <div className="text-xs text-gray-400">
          Página {page + 1} de {totalPages}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-y-auto max-h-[280px] min-h-[280px]">
        <table className="min-w-[600px] w-full table-fixed text-left text-[11px]">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-700">
              <th className="w-10 px-2 py-2"></th>
              <th className="w-2/5 px-2 py-2">Video URL</th>
              <th className="w-1/5 px-2 py-2">Origen</th>
              <th className="w-1/5 px-2 py-2">Estado</th>
              <th className="w-1/5 px-2 py-2">Publicado</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((video, i) => (
              <tr
                key={video.id}
                className={`${
                  i % 2 === 0 ? "bg-neutral-800" : "bg-neutral-900"
                } text-xs`}
              >
                <td className="px-2 py-2 text-gray-400 text-base">
                  <div className="flex flex-col items-center">
                    <FiChevronUp className="hover:text-blue-400 cursor-pointer" />
                    <FiChevronDown className="hover:text-blue-400 cursor-pointer" />
                  </div>
                </td>
                <td className="px-2 py-2 truncate">
                  <p className="font-medium text-white truncate break-all">
                    {video.url}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {video.profile}
                  </p>
                </td>
                <td className="px-2 py-2 font-medium text-blue-400 flex items-center gap-1 capitalize">
                  {video.origen}
                  {video.origen === "instagram" && (
                    <FaMedal className="text-pink-400 text-[10px]" />
                  )}
                </td>
                <td className="px-2 py-2">
                  <span className={getStatusStyle(video.estado)}>
                    {video.estado}
                  </span>
                </td>
                <td className="px-2 py-2 text-white text-[11px]">
                  {video.fecha_publicado
                    ? new Date(video.fecha_publicado).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-2 py-1 bg-neutral-800 border-t border-slate-700">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="text-xs text-blue-400 hover:underline disabled:text-gray-500"
          disabled={page === 0}
        >
          Anterior
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          className="text-xs text-blue-400 hover:underline disabled:text-gray-500"
          disabled={page >= totalPages - 1}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TeamTable;
