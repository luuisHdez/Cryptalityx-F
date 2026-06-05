import axios from 'axios';
import Cookies from 'js-cookie';

axios.defaults.withCredentials = true;
// Crea una instancia de Axios para las solicitudes de autenticación
const authApi = axios.create({
    baseURL: `https://${window.location.hostname}:8000/`,
    withCredentials: true  // ✅ Permite el uso de cookies en solicitudes cross-site
});

export const refreshToken = async () => {
    try {
        const response = await authApi.post('token/refresh/');
        console.log('Nuevo access token:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error al refrescar token:', error);
        throw error;
    }
};

authApi.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            try {
                await refreshToken();
                // Reintenta la solicitud original
                return authApi(error.config);
            } catch (refreshError) {
                console.error("Refresh token falló:", refreshError);
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);




// 📌 Obtiene el token CSRF
export const fetchCSRFToken = async () => {
    try {
        const response = await authApi.get('csrf-token/');
        Cookies.set('csrftoken', response.data.csrftoken, { path: '/' });
        console.log('CSRF token obtenido:', response.data.csrftoken);
    } catch (error) {
        console.error('Error al obtener CSRF token:', error);
    }
};



// 📌 Función para iniciar sesión
export const loginUser = (credentials) => {
    const csrfToken = Cookies.get('csrftoken'); // 🔥 Obtiene el CSRF token antes de la solicitud

    return authApi.post('login/', credentials, {
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken // 🔥 Se añade CSRF Token en la cabecera
        }
    })
    .then(response => {
        console.log("Login exitoso:", response.data);
        return response.data;
    })
    .catch(error => {
        console.error("Error en login:", error);
        throw error;
    });
};


// 📌 Función para registrar un nuevo usuario
export const register = (credentials) => {
    return authApi.post('register/', {
        email: credentials.email,
        password1: credentials.password,
        password2: credentials.confirmPassword
    }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
    })
    .then(response => {
        console.log("Registro exitoso:", response.data);
        return response.data;  // Solo devuelve datos sin almacenar tokens
    })
    .catch(error => {
        console.error("Error en registro:", error);
        throw error;
    });
};

export const logout = () => {
    authApi.post("logout/", { withCredentials: true })
        .then(() => {
            console.log("Sesión cerrada correctamente");

            // Borra las cookies con los nombres correctos
            document.cookie = "jwt-auth=; Max-Age=0; path=/";
            document.cookie = "access_token=; Max-Age=0; path=/";
            document.cookie = "google_access_token=; Max-Age=0; path=/";

            window.location.href = "/login";
        })
        .catch(error => {
            console.error("Error al cerrar sesión:", error);
        });
};





