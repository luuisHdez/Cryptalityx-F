import React, { useState } from "react";
import { motion } from "framer-motion";
import { SiYoutube } from "react-icons/si";
import { uploadToYouTube } from "../../APIAutomation/VideoAPI";
import { toast } from "react-toastify";
import BarLoader from "./BarLoader";

const buttonData = [
  {
    icon: <SiYoutube />,
    bgClass: "bg-red-500 text-white",
    hover: { rotate: "2.5deg", scale: 1.1 },
  },
];

const SocialButtons = ({ filename }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!filename.trim() || !title.trim()) {
      toast.error("❌ Título y archivo son obligatorios.");
      return;
    }

    try {
        setIsUploading(true);
        const videoData = {
          video_filename: filename.trim(),
          title: title.trim(),
          description: description.trim() || "",
        };
        await uploadToYouTube(videoData);
        toast.success("✅ Video enviado a YouTube.");
      
        // 🔽 Limpiar campos SOLO si fue exitoso
        setTitle("");
        setDescription("");
      } catch (error) {
        toast.error(`❌ Error al subir: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
      
  };

  return (
  <div className="relative w-full border border-zinc-700/50 rounded-2xl p-4 overflow-x-auto">
    {isUploading && (
      <div className="absolute inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center rounded-2xl pointer-events-none">
        <BarLoader />
      </div>
    )}

    {/* Fila siempre en una línea, con posible scroll horizontal */}
    <div className="flex flex-row flex-nowrap gap-4">
      {/* Columna de Inputs: 60% del ancho */}
      <div className="flex-none w-3/5 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 bg-neutral-800 border border-slate-600 rounded text-white text-sm"
          disabled={isUploading}
        />
        <textarea
          placeholder="Descripción (opcional)"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 bg-neutral-800 border border-slate-600 rounded text-white text-sm resize-none"
          disabled={isUploading}
        />
      </div>

      {/* Columna de Botones: 40% del ancho */}
      <div className="flex-none w-2/5 flex flex-col items-center gap-3">
        <h2 className="text-sm md:text-base font-semibold text-center w-full">
          Cargar video
        </h2>

        <div className="flex items-center justify-center gap-3">
          {buttonData.map(({ icon, bgClass, hover }, idx) => (
            <motion.button
              key={idx}
              whileHover={hover}
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", mass: 3, stiffness: 400, damping: 50 }}
              onClick={handleUpload}
              disabled={isUploading}
              className={`
                rounded-lg border border-zinc-700 ${bgClass}
                flex items-center justify-center
                w-10 h-10
                md:w-14 md:h-14
                lg:w-16 lg:h-16
                text-2xl md:text-3xl
                transition ${ isUploading ? "opacity-50 cursor-not-allowed" : "hover:scale-105" }
              `}
              type="button"
            >
              {icon}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  </div>
)
;

};

export default SocialButtons;
