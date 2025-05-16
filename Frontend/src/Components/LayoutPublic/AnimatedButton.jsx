import { motion, useAnimate } from "framer-motion";

const NO_CLIP = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
const BOTTOM_RIGHT_CLIP = "polygon(0 0, 100% 0, 0 0, 0% 100%)";
const TOP_RIGHT_CLIP = "polygon(0 0, 0 100%, 100% 100%, 0% 100%)";
const BOTTOM_LEFT_CLIP = "polygon(100% 100%, 100% 0, 100% 100%, 0 100%)";
const TOP_LEFT_CLIP = "polygon(0 0, 100% 0, 100% 100%, 100% 0)";

const ENTRANCE_KEYFRAMES = {
  left: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  bottom: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  top: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  right: [TOP_LEFT_CLIP, NO_CLIP],
};

const EXIT_KEYFRAMES = {
  left: [NO_CLIP, TOP_RIGHT_CLIP],
  bottom: [NO_CLIP, TOP_RIGHT_CLIP],
  top: [NO_CLIP, TOP_RIGHT_CLIP],
  right: [NO_CLIP, BOTTOM_LEFT_CLIP],
};

const getNearestSide = (e) => {
  const box = e.currentTarget.getBoundingClientRect();
  const proximity = [
    { side: "left", value: Math.abs(box.left - e.clientX) },
    { side: "right", value: Math.abs(box.right - e.clientX) },
    { side: "top", value: Math.abs(box.top - e.clientY) },
    { side: "bottom", value: Math.abs(box.bottom - e.clientY) },
  ];
  return proximity.sort((a, b) => a.value - b.value)[0].side;
};

const AnimatedButton = ({ onClick, children, className = "", type = "button" }) => {
  const [scope, animate] = useAnimate();

  const handleEnter = (e) => {
    const side = getNearestSide(e);
    animate(scope.current, { clipPath: ENTRANCE_KEYFRAMES[side] });
  };

  const handleLeave = (e) => {
    const side = getNearestSide(e);
    animate(scope.current, { clipPath: EXIT_KEYFRAMES[side] });
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        ref={scope}
        style={{ clipPath: BOTTOM_RIGHT_CLIP }}
        className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-white pointer-events-none"
      >
        {children}
      </motion.div>
    </button>
  );
};

export default AnimatedButton;
