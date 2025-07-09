import React from "react";
import { motion } from "framer-motion";

const loaderVariants = {
  initial: { scaleY: 0.5, opacity: 0 },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: "mirror",
      duration: 1,
      ease: "circIn",
    },
  },
};

const BarLoader = () => (
  <motion.div
    transition={{ staggerChildren: 0.25 }}
    initial="initial"
    animate="animate"
    className="flex gap-1"
  >
    {Array(5)
      .fill(0)
      .map((_, i) => (
        <motion.div key={i} variants={loaderVariants} className="h-12 w-2 bg-white" />
      ))}
  </motion.div>
);

export default BarLoader;
