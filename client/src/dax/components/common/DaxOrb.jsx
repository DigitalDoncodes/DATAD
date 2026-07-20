import { motion } from 'framer-motion';

// Dax's physical presence — a floating gradient orb with blinking eyes.
// Shared between the intro/outro curtain and the empty conversation state
// so Dax reads as one continuous character across the experience.
//
// size: diameter of the core in px. waving: plays a side-to-side wave once.
// layoutId: pass the same id in two places (e.g. intro curtain + home) and
// framer-motion animates the orb flying between them on mount/unmount.
export default function DaxOrb({ size = 80, waving = false, className = '', layoutId }) {
  const glow = size * 2;
  const orbit = size * 1.4;
  const eyeH = Math.max(8, size * 0.175);
  const eyeW = Math.max(4, size * 0.1);

  return (
    <motion.div
      layoutId={layoutId}
      transition={{ layout: { type: 'spring', stiffness: 170, damping: 22 } }}
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: glow, height: glow }}
    >
      {/* soft outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: glow, height: glow,
          background: 'radial-gradient(circle, rgb(var(--dax-accent-rgb) / 0.35) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* orbiting spark */}
      <motion.div
        className="absolute"
        style={{ width: orbit, height: orbit }}
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      >
        <span
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: Math.max(4, size * 0.075), height: Math.max(4, size * 0.075),
            background: 'var(--dax-accent)',
            boxShadow: '0 0 8px 2px rgb(var(--dax-accent-rgb) / 0.6)',
          }}
        />
      </motion.div>
      {/* core */}
      <motion.div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size, height: size,
          background: 'linear-gradient(135deg, var(--dax-accent) 0%, rgb(var(--dax-accent-rgb) / 0.65) 100%)',
          boxShadow: `0 ${size * 0.1}px ${size * 0.4}px rgb(var(--dax-accent-rgb) / 0.45)`,
        }}
        animate={waving ? { rotate: [0, -12, 12, -8, 8, 0] } : { y: [0, -size * 0.075, 0] }}
        transition={
          waving
            ? { duration: 0.9, ease: 'easeInOut' }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* minimal face: two blinking eyes */}
        <div className="flex" style={{ gap: size * 0.15 }}>
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="rounded-full"
              style={{ width: eyeW, height: eyeH, background: 'var(--dax-accent-contrast)' }}
              animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
              transition={{ duration: 3.2, times: [0, 0.44, 0.5, 0.56, 1], repeat: Infinity, delay: i * 0.02 }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
