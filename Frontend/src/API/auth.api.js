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


export const googleLogin = async (code) => {
    const csrfToken = Cookies.get('csrftoken');

    try {
        const response = await authApi.post('google-oauth/', { code }, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
                withCredentials: true,  // Si necesitas que las cookies sean enviadas, habilita 'withCredentials'
            }
        );
        return response.data;  // Retorna la respuesta del backend (mensaje de éxito)
    } catch (error) {
        // Mejor manejo de errores para poder ver detalles
        if (error.response) {
            // Si la respuesta fue un error con código de estado
            console.error('Error Response:', error.response.data);
            // Puedes personalizar cómo manejas el error aquí
            return { error: error.response.data.error || 'Error desconocido desde el servidor' };
        } else if (error.request) {
            // Si la solicitud fue hecha pero no recibimos respuesta
            console.error('Error Request:', error.request);
            return { error: 'No se recibió respuesta del servidor' };
        } else {
            // Si hubo un error durante la configuración de la solicitud
            console.error('Error Message:', error.message);
            return { error: error.message };
        }
    }
};



