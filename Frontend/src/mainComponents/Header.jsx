import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { logout } from "../API/auth.api";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

const DURATION = 0.25;
const STAGGER = 0.025;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente", { theme: "dark" });
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <>
      <ToastContainer />
      <header className="z-40 relative">
        <nav className="bg-gray-800 border-b border-slate-700 px-4 lg:px-6 py-2.5">
          <div className="flex justify-between items-center w-full px-4">

            {/* Botón logout */}
            <div className="ml-auto">
              <button
                onClick={handleLogout}
                className="text-white hover:bg-gray-700 focus:ring-4 focus:ring-gray-600 font-medium rounded-lg text-sm px-4 py-2 focus:outline-none"
              >
                Log out
              </button>
            </div>

            {/* Logo centrado con efecto */}
            <div
              onClick={handleLogoClick}
              className="absolute left-1/2 transform -translate-x-1/2 flex items-center cursor-pointer"
            >
              <img
                src="https://flowbite.com/docs/images/logo.svg"
                className="mr-3 h-6 sm:h-9"
                alt="Logo"
              />
              <motion.span
                initial="initial"
                whileHover="hovered"
                className="relative block overflow-hidden whitespace-nowrap font-mono text-indigo-300 text-xl sm:text-2xl font-semibold"
                style={{ lineHeight: 1 }}
              >
                <div>
                  {"CRYPTALYTIX".split("").map((l, i) => (
                    <motion.span
                      key={`top-${i}`}
                      variants={{
                        initial: { y: 0 },
                        hovered: { y: "-100%" },
                      }}
                      transition={{
                        duration: DURATION,
                        ease: "easeInOut",
                        delay: STAGGER * i,
                      }}
                      className="inline-block"
                    >
                      {l}
                    </motion.span>
                  ))}
                </div>
                <div className="absolute inset-0">
                  {"CRYPTALYTIX".split("").map((l, i) => (
                    <motion.span
                      key={`bot-${i}`}
                      variants={{
                        initial: { y: "100%" },
                        hovered: { y: 0 },
                      }}
                      transition={{
                        duration: DURATION,
                        ease: "easeInOut",
                        delay: STAGGER * i,
                      }}
                      className="inline-block"
                    >
                      {l}
                    </motion.span>
                  ))}
                </div>
              </motion.span>
            </div>
          </div>
        </nav>
      </header>

      {/* Sidebar externo */}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
