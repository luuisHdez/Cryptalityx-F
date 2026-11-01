import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from 'js-cookie';
import { useSocket } from "../contexts/SocketContext";

const PrivateRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const { connectSocket } = useSocket();
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = `https://${window.location.hostname}:8000`;
  useEffect(() => {
    const checkAuth = async () => {
      console.log("PrivateRoute se está ejecutando");
      const csrfToken = Cookies.get('csrftoken');
      try {
        const response = await axios.get(`https://${window.location.hostname}:8000/debug-user/`, {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken // 🔥 Se añade CSRF Token en la cabecera
        },withCredentials: true, // Envía cookies HTTP-only al backend
        });
        console.log("Usuario autenticado:", response.data);  // Muestra detalles del usuario
        setIsAuthenticated(true);
        connectSocket(); // ✅ Conectar socket DESPUÉS de confirmar auth
      } catch (error) {
        console.error("Error de autenticación:", error.response?.status);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) return <p>Cargando...</p>; // Muestra un loader mientras se verifica

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
