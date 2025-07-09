import React, { useState } from "react";
import { toast } from "react-toastify";
import { registrarCanal } from "../../APIAutomation/VideoAPI";

const ChannelForm = ({ profileId, disabled }) => {
    const [channelData, setChannelData] = useState({
        channel_id: "",
        channel_name: "",
        authorized_email: "",
        token_filename: "",
        default_description: "",
        default_tags: "",
    });

    const isComplete = Object.values(channelData).slice(0, 4).every((v) => v.trim() !== "");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setChannelData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!profileId || profileId.trim() === "") {
            toast.error("❌ Debes seleccionar un perfil antes de guardar el canal.");
            return;
        }

        if (!isComplete) {
            toast.error("❌ Todos los campos obligatorios deben estar llenos.");
            return;
        }

        try {
            const payload = {
                profile_name: profileId,
                ...channelData,
            };

            await registrarCanal(payload);
            toast.success("✅ Canal guardado correctamente");

            // Limpiar formulario
            setChannelData({
                channel_id: "",
                channel_name: "",
                authorized_email: "",
                token_filename: "",
                default_description: "",
                default_tags: "",
            });
        } catch (err) {
            toast.error("❌ Error al guardar canal");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md text-white text-xs space-y-2">
            {/* Grid de 3 columnas x 2 filas */}
            <div className="grid grid-cols-3 gap-2">
                <input
                    name="channel_name"
                    disabled={disabled}
                    placeholder="Channel Name"
                    onChange={handleChange}
                    value={channelData.channel_name}
                    className="p-1 bg-neutral-800 border border-slate-600 rounded"
                />
                <input
                    name="authorized_email"
                    disabled={disabled}
                    placeholder="Authorized Email"
                    onChange={handleChange}
                    value={channelData.authorized_email}
                    className="p-1 bg-neutral-800 border border-slate-600 rounded"
                />
                <input
                    name="channel_id"
                    disabled={disabled}
                    placeholder="Channel ID"
                    onChange={handleChange}
                    value={channelData.channel_id}
                    className="p-1 bg-neutral-800 border border-slate-600 rounded"
                />
                <input
                    name="token_filename"
                    disabled={disabled}
                    placeholder="Token Filename"
                    onChange={handleChange}
                    value={channelData.token_filename}
                    className="p-1 bg-neutral-800 border border-slate-600 rounded"
                />
                <input
                    name="default_description"
                    disabled={disabled}
                    placeholder="Default Description"
                    onChange={handleChange}
                    value={channelData.default_description}
                    className="p-1 bg-neutral-800 border border-slate-600 rounded"
                />
                <input
                    name="default_tags"
                    disabled={disabled}
                    placeholder="Default Tags"
                    onChange={handleChange}
                    value={channelData.default_tags}
                    className="p-1 bg-neutral-800 border border-slate-600 rounded"
                />
            </div>

            {/* Botón */}
            <div className="flex justify-center pt-2">
                <button
                    type="submit"
                    disabled={disabled || !isComplete}
                    className={`bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded transition 
          ${!isComplete ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
                >
                    Guardar canal
                </button>
            </div>
        </form>
    );
};

export default ChannelForm;
