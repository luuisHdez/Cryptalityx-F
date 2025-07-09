import axios from 'axios';

// Configura la URL base de tu servidor FastAPI
const API_BASE_URL = "http://127.0.0.1:8002"; // <-- Cambia esta IP por tu IP local si quieres acceder desde celular

// Función para manejar errores de fetch
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Error desconocido");
    }
    return data;
  } catch (error) {
    console.error(`❌ Error al hacer fetch a ${url}:`, error.message);
    throw error;
  }
}

// --- Funciones específicas de la API ---

// 1. Obtener y guardar videos de un perfil
export async function fetchProfile(profile) {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/fetch-profile/?profile=${profile}`);
  } catch (error) {
    console.error("❌ Error al hacer fetchProfile:", error.message);
    throw error;
  }
}

// 2. Actualizar las fechas de los videos
export async function actualizarFechas(profile) {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/actualizar-fechas/?profile=${profile}`);
  } catch (error) {
    console.error("❌ Error al hacer actualizarFechas:", error.message);
    throw error;
  }
}

// 3. Descargar el video más antiguo pendiente
export async function downloadVideo(profile) {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/download-video/?profile=${profile}`);
  } catch (error) {
    console.error("❌ Error al hacer downloadVideo:", error.message);
    throw error;
  }
}


// 4. Subir un video descargado al bucket de S3
export async function uploadToS3() {
  return await fetchWithErrorHandling(`${API_BASE_URL}/upload-to-s3/`, {
    method: "POST",
  });
}

export async function updateLink(url, profile_name) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/update-link/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      profile_name,
    }),
  });
}


// 5. Obtener lista de videos en S3
export async function fetchS3Videos() {
  return await fetchWithErrorHandling(`${API_BASE_URL}/s3-videos/`);
}

export async function fetchDBVideos() {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/videos/`);
    console.log("✅ Datos recibidos desde /videos/:", response); // Validación
    return response;
  } catch (error) {
    console.error("❌ Error en fetchDBVideos:", error.message);
    return [];
  }
}

export async function fetchDBPerfiles() {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/perfiles/`);
    console.log("✅ Datos recibidos desde /videos/:", response); // Validación
    return response;
  } catch (error) {
    console.error("❌ Error en fetchDBPerfiles:", error.message);
    return [];
  }
}

export async function editVideo(formValues) {
  console.log(formValues)
  const formData = new FormData();
  formData.append("filename", formValues.filename);

  if (formValues.speed) formData.append("speed", formValues.speed);
  if (formValues.margin) formData.append("margin", formValues.margin);
  if (formValues.color_factor) formData.append("color_factor", formValues.color_factor);
  if (formValues.rotate_angle) formData.append("rotate_angle", formValues.rotate_angle);
  if (formValues.lum) formData.append("lum", formValues.lum);
  if (formValues.contrast) formData.append("contrast", formValues.contrast);
  if (formValues.contrast_thr) formData.append("contrast_thr", formValues.contrast_thr);
  if (formValues.text) formData.append("text", formValues.text);
  if (formValues.fade) formData.append("fade", formValues.fade);
  if (formValues.animate) formData.append("animate", formValues.animate);
  if (formValues.emoji_name) formData.append("emoji_name", formValues.emoji_name);

  // Nuevo parámetro: blurred_margin
  if (formValues.blurred_margin !== undefined) {
    formData.append("blurred_margin", formValues.blurred_margin ? "true" : "false");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/edit-video/`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Error al editar video");
    }
    return data;
  } catch (error) {
    console.error("❌ Error al hacer editVideo:", error.message);
    throw error;
  }
}


export async function uploadToS3ByFilename(filename, id) {
  console.log("archivo", filename)
  return await fetchWithErrorHandling(`${API_BASE_URL}/upload-to-s3/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, id }),
  });
}

export async function registrarCanal(canalData) {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/registrar-canal/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile_name: canalData.profile_name,
        channel_id: canalData.channel_id,
        channel_name: canalData.channel_name,
        authorized_email: canalData.authorized_email,
        token_filename: canalData.token_filename,
        default_description: canalData.default_description || "",
        default_tags: canalData.default_tags || ""
      }),
    });
  } catch (error) {
    console.error("❌ Error al registrar canal:", error.message);
    throw error;
  }
}


export async function uploadToYouTube(videoData) {
  try {
    console.log(videoData)
    return await fetchWithErrorHandling(`${API_BASE_URL}/upload-youtube/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(videoData),
    });
  } catch (error) {
    console.error("❌ Error al subir video a YouTube:", error.message);
    throw error;
  }
}