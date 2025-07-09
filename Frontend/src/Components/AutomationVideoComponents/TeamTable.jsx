import React, { useEffect, useState } from "react";
import { uploadToS3ByFilename } from "../../APIAutomation/VideoAPI";
import { fetchDBVideos } from "../../APIAutomation/VideoAPI";
import { toast } from "react-toastify";

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

  useEffect(() => {
    const savedFiltro = getWithExpiry("estadoFiltro");
    if (savedFiltro) {
      setEstadoFiltro(savedFiltro);
    }
  }, []);

  const handleUpload = async (filename, idVideo) => {
    try {
      const result = await uploadToS3ByFilename(filename, idVideo); // se manda también el id
  
      console.log("✅ Video subido:", result);
      toast.success("✅ Video subido correctamente a S3");
  
      const updated = await fetchDBVideos();
      setVideos(updated);
    } catch (error) {
      console.error("❌ Error al subir a S3:", error.message);
      toast.error("❌ Error al subir video a S3");
    }
  };
  

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


  const recargarTabla = async () => {
    try {
      const data = await fetchDBVideos();
      setVideos(data);
      toast.success("🔄 Tabla actualizada");
    } catch (error) {
      console.error("❌ Error al recargar videos:", error.message);
      toast.error("❌ Error al recargar la tabla");
    }
  };
  

  const handleFiltroChange = (e) => {
    const nuevoEstado = e.target.value;
    setEstadoFiltro(nuevoEstado);
    setWithExpiry("estadoFiltro", nuevoEstado);
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

        <label className="text-xs text-gray-400 flex items-center gap-1">
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
    <option value="modificado">Modificado</option>
    <option value="Publicado">Publicado</option>
  </select>
  <button
    onClick={recargarTabla}
    className="ml-2 px-2 py-0.5 text-xs border border-blue-500 rounded text-blue-400 hover:bg-blue-800 transition"
  >
    ↻
  </button>
</label>


        <div className="text-xs text-gray-400">
          Página {page + 1} de {totalPages}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-y-auto max-h-[280px] min-h-[280px]">
      <table className="min-w-[600px] w-full table-fixed text-left text-[10px]">
  <thead>
    <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-700">
      <th className="w-3/5 px-2 py-1">Video URL</th>
      <th className="w-1/5 px-2 py-1">Origen</th>
      <th className="w-1/5 px-2 py-1">Estado</th>
      <th className="w-1/5 px-2 py-1">Publicado</th>
      <th className="w-1/5 px-2 py-1">Acción</th>
    </tr>
  </thead>
  <tbody>
    {paginated.map((video, i) => (
      <tr
        key={video.id}
        className={`${
          i % 2 === 0 ? "bg-neutral-800" : "bg-neutral-900"
        } text-[10px]`}
      >
        <td className="px-2 py-1 truncate">
          <p className="font-medium text-white text-[9px] truncate break-all">
            {video.url}
          </p>
          <p className="px-2 text-[10px] text-gray-400 truncate">
            {video.profile}
          </p>
        </td>
        <td className="px-2 py-1 font-medium text-blue-400 flex items-center gap-1 capitalize">
          {video.origen}
        </td>
        <td className="px-2 py-1">
          <span className={getStatusStyle(video.estado)}>
            {video.estado}
          </span>
        </td>
        <td className="px-2 py-1 text-white text-[10px]">
          {video.fecha_publicado
            ? new Date(video.fecha_publicado).toLocaleDateString()
            : "—"}
        </td>
        <td className="px-2 py-1">
        <button
          disabled={video.estado !== "descargado"}
          onClick={() => {
            const parts = video.url.split("/");
            const lastPart = parts.filter(Boolean).pop(); // elimina vacíos y toma el último
            const filename = `${lastPart}`;
            handleUpload(filename, video.id);
          }}
          className={`relative overflow-hidden rounded text-[10px] font-medium px-2 py-1 transition ${
            video.estado === "descargado"
              ? "border border-slate-700 bg-neutral-900 text-white group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#166534] active:translate-x-0 active:translate-y-0 active:rounded group"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {video.estado === "descargado" && (
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-green-400 to-green-800 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />


          )}
          <span className="relative z-10">Cargar a S3</span>
        </button>
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
          disabled={page === 0}
          className="relative overflow-hidden rounded-lg border border-slate-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#1e3a8a] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-500 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          <span className="relative z-10">Anterior</span>
        </button>

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="relative overflow-hidden rounded-lg border border-slate-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#1e3a8a] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-500 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          <span className="relative z-10">Siguiente</span>
        </button>
      </div>
    </div>
  );
};

export default TeamTable;
