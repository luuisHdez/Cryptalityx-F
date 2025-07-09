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
              className="relative overflow-hidden rounded-lg border border-slate-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase text-white transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rounded-md hover:shadow-[2px_2px_0px_#1e3a8a] active:translate-x-0 active:translate-y-0 active:rounded-lg active:shadow-none group"
            >
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-600 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
              <span className="relative z-10">Log out</span>
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
