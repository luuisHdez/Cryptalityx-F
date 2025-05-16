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
export async function fetchProfile() {
  return await fetchWithErrorHandling(`${API_BASE_URL}/fetch-profile/`);
}

// 2. Actualizar las fechas de los videos
export async function actualizarFechas(origen = "instagram") {
  return await fetchWithErrorHandling(`${API_BASE_URL}/actualizar-fechas/?origen=${origen}`);
}

// 3. Descargar el video más antiguo pendiente
export async function downloadVideo(origen) {
    return await fetchWithErrorHandling(`${API_BASE_URL}/download-video/?origen=${origen}`);
  }
  
  

// 4. Subir un video descargado al bucket de S3
export async function uploadToS3() {
  return await fetchWithErrorHandling(`${API_BASE_URL}/upload-to-s3/`, {
    method: "POST",
  });
}

export async function updateLink(url, score = null) {
    return await fetchWithErrorHandling(`${API_BASE_URL}/update-link/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        score,
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
  