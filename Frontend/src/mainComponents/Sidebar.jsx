import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiChevronDown,
  FiChevronsRight,
  FiDollarSign,
  FiHome,
  FiMonitor,
  FiShoppingCart,
  FiTag,
  FiUsers,
} from "react-icons/fi";

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="fixed top-0 left-0 z-50 h-screen"
      >
        <motion.nav
          layout
          className={`h-full border-r border-slate-700 bg-gray-800 p-2 text-white transition-all duration-300 ease-in-out ${
            open ? "w-[225px]" : "w-[45px] sm:w-[55px]"
          }`}
        >
          <TitleSection open={open} />

          <div className="space-y-1">
            <SidebarOption Icon={FiHome} title="Dashboard" open={open} />
            <SidebarOption Icon={FiDollarSign} title="Sales" open={open} />
            <SidebarOption Icon={FiMonitor} title="View Site" open={open} />
            <SidebarOption Icon={FiShoppingCart} title="Products" open={open} />
            <SidebarOption Icon={FiTag} title="Tags" open={open} />
            <SidebarOption Icon={FiBarChart} title="Analytics" open={open} />
            <SidebarOption Icon={FiUsers} title="Members" open={open} />
          </div>

          <ToggleClose open={open} setOpen={setOpen} />
        </motion.nav>
      </div>
    </>
  );
};

const SidebarOption = ({ Icon, title, open }) => (
  <motion.button
    layout
    className="relative flex h-10 w-full items-center rounded-md px-1 group overflow-hidden text-gray-300 hover:text-white transition-colors"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0" />
    <motion.div layout className="grid h-full w-10 place-content-center text-lg relative z-10">
      <Icon />
    </motion.div>
    {open && (
      <motion.span
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-sm font-medium relative z-10"
      >
        {title}
      </motion.span>
    )}
  </motion.button>
);

const TitleSection = ({ open }) => (
  <div className="mb-3 border-b border-slate-600 pb-3">
    <div className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-700">
      <div className="flex items-center gap-2">
        <Logo />
        {open && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="block text-sm font-semibold">Cryptalytix</span>
            <span className="block text-xs text-slate-400">User</span>
          </motion.div>
        )}
      </div>
      {open && <FiChevronDown className="mr-2" />}
    </div>
  </div>
);

const Logo = () => (
  <motion.div
    layout
    className="grid size-10 shrink-0 place-content-center rounded-md bg-indigo-600"
  >
    <svg
      width="24"
      viewBox="0 0 50 39"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="fill-white"
    >
      <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
      <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
    </svg>
  </motion.div>
);

const ToggleClose = ({ open, setOpen }) => (
  <motion.button
    layout
    onClick={() => setOpen((prev) => !prev)}
    className="absolute bottom-0 left-0 right-0 border-t border-slate-600 hover:bg-gray-700"
  >
    <div className="flex items-center p-2">
      <motion.div layout className="grid size-10 place-content-center text-lg">
        <FiChevronsRight className={`transition-transform ${open && "rotate-180"}`} />
      </motion.div>
      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-medium"
        >
          Hide
        </motion.span>
      )}
    </div>
  </motion.button>
);

export default Sidebar;
