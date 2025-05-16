import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { loginUser, register } from "../../API/auth.api";
import { ToastContainer, toast } from 'react-toastify';
import { googleLogin } from "../../API/auth.api";
import { useGoogleLogin } from '@react-oauth/google';
import AnimatedButton from "./AnimatedButton";
import { SiGoogle, SiGithub } from "react-icons/si";
import SpotlightButton from "./SpotlightButton";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

const Login = ({ mode }) => {
  const isLogin = mode === "login";
  const [credentials, setCredentials] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      rotateX: [10, 15],
      rotateY: [-10, -15],
      transition: {
        repeat: Infinity,
        repeatType: "mirror",
        duration: 3,
        ease: "easeInOut",
      },
    });
  }, [controls]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    if (isLogin) {
      try {
        const data = await loginUser(credentials);
        toast.success("Sucess Loggin");
        navigate('/');
      } catch (error) {
        toast.error(error?.response?.data?.error || "Error al iniciar sesión");
      }
    } else {
      try {
        if (credentials.password !== credentials.confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return;
        }
        await register(credentials);
        toast.success("Registro exitoso");
      } catch (error) {
        toast.error(error?.response?.data?.error || "Error al registrar");
      }
    }
  };

  const googleLoginHandler = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (tokenResponse) => {
      try {
        const code = tokenResponse.code;
        if (!code) throw new Error("El authorization code está vacío o no existe.");
        const data = await googleLogin(code);
        toast.success("Inicio de sesión con Google exitoso");
        setTimeout(() => navigate('/'), 1000);
      } catch (error) {
        toast.error(error?.response?.data?.error || "Error al iniciar sesión con Google");
      }
    },
    onError: () => toast.error("Error al iniciar sesión con Google"),
  });

  return (
    <div className="w-full px-4 py-12 bg-transparent flex justify-center" style={{ perspective: "1200px" }}>
      <ToastContainer />
      <motion.div
        animate={controls}
        whileHover={{
          rotateX: 0,
          rotateY: 0,
          translateZ: 0,
          boxShadow: "0px 25px 50px rgba(99, 102, 241, 0.8)",
          opacity: 8
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
        className="relative z-10"
        onMouseEnter={() => controls.stop()}
        onMouseLeave={() =>
          controls.start({
            rotateX: [10, 15],
            rotateY: [-10, -15],
            transition: {
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3,
              ease: "easeInOut",
            },
          })
        }
      >
        {/* Sombra 3D */}
        <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-xl bg-indigo-600 z-0" style={{ opacity: 0.7 }}></div>

        {/* Formulario */}
        <motion.form
          onSubmit={handleLogin}
          className="bg-white bg-opacity-40 backdrop-blur p-8 rounded-lg w-full max-w-md text-white relative z-10"
        >
          <h2 className="text-center text-2xl font-bold text-white">{isLogin ? "Sign in" : "Register"}</h2>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-white">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-white">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className=" text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center text-sm text-white">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              Remember me
            </label>
            <a href="#" className="text-sm font-medium text-indigo-1000 hover:text-indigo-800">Forgot password?</a>
          </div>

          <SpotlightButton
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-black"
          >
            Sign in
          </SpotlightButton>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-black text-white">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <AnimatedButton onClick={() => googleLoginHandler()}
                className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <SiGoogle className="mr-2 text-lg" />
              </AnimatedButton>

              <AnimatedButton onClick={() => { }}
                className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <SiGithub className="mr-2 text-lg" />
              </AnimatedButton>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
