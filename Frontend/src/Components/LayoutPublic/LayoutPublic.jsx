// src/Components/LayoutPublic.jsx
import { Outlet } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
import { useEffect } from "react";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

const LayoutPublic = () => {
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})`;

  return (
    <motion.div
      style={{ backgroundImage }}
      className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white"
    >
      {/* Fondo animado con estrellas */}
      <div className="absolute inset-0 z-0">
  <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
    <Stars
      radius={100}   // Mayor radio para que el "espacio" se sienta infinito
      depth={80}     // Aumenta la profundidad (por defecto es 50)
      count={5000}   // Más estrellas
      factor={5}     // Tamaño/espaciado más natural
      saturation={0} // Estrellas más blancas (sin colores)
      fade          // Estrellas que se difuminan al alejarse
      speed={3}     // Movimiento de las estrellas más rápido
    />
  </Canvas>
</div>

      {/* Contenido de rutas públicas como login/register */}
      <div className="relative z-10 py-12 px-4">
        <Outlet />
      </div>
    </motion.div>
  );
};

export default LayoutPublic;
