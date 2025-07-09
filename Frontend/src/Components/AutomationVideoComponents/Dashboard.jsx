// src/Components/Dashboard.jsx
import React, { useRef, useState, useEffect } from "react";
import { FiZap } from "react-icons/fi";
import { motion } from "framer-motion";
import Options from "./Options";
import TeamTable from "./TeamTable";
import VideoPlayer from "./VideoPlayer";
import EditOptions from "./EditOptions";

const Dashboard = () => {
  const TARGET_TEXT = "ANÁLISIS DE VIDEOS  WEB SCRAPING";
  const CYCLES_PER_LETTER = 2;
  const SHUFFLE_TIME = 50;
  const CHARS = "!@#$%^&*():{};|,.<>/?";

  const intervalRef = useRef(null);
  const [text, setText] = useState(TARGET_TEXT);
  const [selectedVideo, setSelectedVideo] = useState(null);


  const scramble = () => {
    let pos = 0;
    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split("")
        .map((char, index) => {
          if (pos / CYCLES_PER_LETTER > index) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      setText(scrambled);
      pos++;
      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) stopScramble();
    }, SHUFFLE_TIME);
  };

  const stopScramble = () => {
    clearInterval(intervalRef.current || undefined);
    setText(TARGET_TEXT);
  };

  return (
    <div className="min-h-screen w-full p-6 bg-black flex flex-col gap-6">
      {/* Header animado */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="mb-2 w-full flex justify-center"
      >
        <motion.div
          onMouseEnter={scramble}
          onMouseLeave={stopScramble}
          className="relative inline-flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-6 py-2 text-xs sm:text-sm md:text-base font-mono text-indigo-300 uppercase tracking-wide"
        >
          <FiZap className="text-indigo-400" />
          {text}
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: "-100%" }}
            transition={{
              repeat: Infinity,
              repeatType: "mirror",
              duration: 1,
              ease: "linear",
            }}
            className="absolute inset-0 z-0 scale-125 bg-gradient-to-t from-indigo-400/0 from-40% via-indigo-400/100 to-indigo-400/0 to-60% opacity-0 transition-opacity group-hover:opacity-100"
          />
        </motion.div>
      </motion.div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <div className="w-full h-fit">
          <Options />
        </div>
        <div className="w-full h-fit">
          <TeamTable />
        </div>
        <div className="w-full h-fit">
        <EditOptions selectedVideo={selectedVideo} />
        </div>
        <div className="w-full h-fit">
        <VideoPlayer selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} />
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
