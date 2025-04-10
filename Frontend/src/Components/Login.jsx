import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { loginUser, register } from "../API/auth.api";
import {ToastContainer, toast } from 'react-toastify'
import { googleLogin } from "../API/auth.api";
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';


const Login = ({ mode }) => {
  const isLogin = mode === "login";
  const [credentials, setCredentials] = useState({ email: '', password: '', confirmPassword:'' });
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleLogin = async (event) => {
    event.preventDefault();
    console.log("handleLogin ejecutado", { isLogin, credentials });
  
    setError('');
    
    if (isLogin) {
      console.log("Ejecutando login...");
      try {
        const data = await loginUser(credentials);
        console.log("Respuesta de login:", data);
        toast.success("Sucess Loggin");
        console.log("Cookies después del login:", document.cookie);
        
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          toast.error(error.response.data.error);
      } else {
          toast.error("Error al iniciar sesión");
      }
      }
      console.log("Cookies después del login:", document.cookie);
      navigate('/')
      //window.location.href = '/';
    } else {
      console.log("Ejecutando register...");
      try {
        if (credentials.password !== credentials.confirmPassword) {
          console.log("Las contraseñas no coinciden");
          setError("Las contraseñas no coinciden");
          toast.error("Las contraseñas no coinciden");
          return;
        }
  
        console.log("Enviando solicitud de registro...");
        const data = await register(credentials);
        console.log("Respuesta de register:", data);
        toast.success("Registro exitoso");
        //window.location.href = '/login';
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          toast.error(error.response.data.error);
      } else {
          toast.error("Error al iniciar sesión");
      }
      }
    }
  };

  

  const googleLoginHandler = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (tokenResponse) => {
      try {
        const code = tokenResponse.code;
        console.log("Code:", code);
        if (!code) throw new Error("El authorization code está vacío o no existe.");
  
        const data = await googleLogin(code);
        console.log(data);
        toast.success("Inicio de sesión con Google exitoso");
        setTimeout(() => {
          navigate('/');
        }, 1000); // 1 segundo es suficiente
      } catch (error) {
        console.error('Error:', error);
        toast.error(error?.response?.data?.error || "Error al iniciar sesión con Google");
      }
    },
    onError: () => toast.error("Error al iniciar sesión con Google"),
  });
  
  return (
    
    <div className=" bg-[#212121] flex items-center justify-center min-h-screen bg-gray-100">
      <ToastContainer />
      <form onSubmit={handleLogin} className="bg-white bg-opacity-50 p-8 shadow-lg rounded-lg w-full max-w-md">
      <h2 className="text-center text-2xl font-bold text-gray-700">{isLogin ? "Sing in" : "Register"}</h2>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </a>
          </div>
        </div>
        {!isLogin &&(
          <div className="mb-4">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={credentials.confirmPassword}
            onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        )}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign in
        </button>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            
          <button
            onClick={() => googleLoginHandler()}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Iniciar con Google
          </button>



            <a
              href="#"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <svg fill="currentColor" viewBox="0 0 20 20" className="h-5 w-5 mr-2">
                <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"></path>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Login;
