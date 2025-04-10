import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { logout } from "../API/auth.api";

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

  return (
    <>
      {/* Header */}
    <header>
  <ToastContainer />
  <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
    <div className="flex justify-between items-center w-full px-4">

      
      {/* Botón Hamburguesa ahora a la IZQUIERDA */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 order-first"
      >
        <span className="sr-only">Open main menu</span>
        {!isMenuOpen ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Menú de acciones en el centro */}
      <div className="ml-auto">
        <button
          onClick={handleLogout}
          className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800"
        >
          Log out
        </button>
        
      </div>

      {/* Logo completamente a la DERECHA */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
        <img
          src="https://flowbite.com/docs/images/logo.svg"
          className="mr-3 h-6 sm:h-9"
          alt="Logo"
        />
        <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
          Cryptalytix
        </span>
      </div>

    </div>
  </nav>
</header>


      {/* Overlay para cerrar el sidebar */}
      <div
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Sidebar deslizable */}
      <aside
        className={`fixed left-0 top-0 w-64 h-full bg-white dark:bg-gray-800 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out shadow-lg z-50`}
      >
        {/* Botón para cerrar el sidebar */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg"
          >
            ✖
          </button>
        </div>

        {/* Menú de navegación */}
        <ul className="flex flex-col mt-4 font-medium">
          {[
            { name: "Home", path: "/" },
            { name: "Company", path: "/" },
            { name: "Marketplace", path: "/" },
            { name: "Feature", path: "/" },
            { name: "Team", path: "/" },
            { name: "Contact", path: "/" },
          ].map((item) => (
            <li
              key={item.name}
              className="py-2 px-6 text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Link to={item.path}>{item.name}</Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Header;
