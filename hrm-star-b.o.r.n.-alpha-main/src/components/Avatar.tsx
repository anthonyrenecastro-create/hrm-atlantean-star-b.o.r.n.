import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface AvatarProps {
  coherence: number;
  stability: number;
  fractalDepth: number;
  sentiment: number; // -1 to 1
  gender: 'male' | 'female';
  colorHue?: number;
  hairStyle?: 'ethereal' | 'spiky' | 'flowing';
  faceShape?: 'oval' | 'sharp' | 'round';
}

export const Avatar: React.FC<AvatarProps> = ({ 
  coherence, 
  stability, 
  fractalDepth, 
  sentiment, 
  gender,
  colorHue = 200,
  hairStyle = 'ethereal',
  faceShape = 'oval'
}) => {
  // Map metrics to visual properties
  const hue = colorHue + sentiment * 40; 
  const glowColor = `hsla(${hue}, 80%, 60%, 0.8)`;
  const accentColor = `hsla(${hue + (gender === 'female' ? 20 : -20)}, 90%, 70%, 0.9)`;
  
  const strands = useMemo(() => {
    const count = hairStyle === 'flowing' ? 36 : hairStyle === 'spiky' ? 16 : 24;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2,
      length: (hairStyle === 'spiky' ? 60 : 80) + Math.random() * 40,
      delay: Math.random() * 2,
    }));
  }, [hairStyle]);

  const getFacePath = () => {
    if (faceShape === 'sharp') {
      return "M -70 -40 L -50 80 L 0 120 L 50 80 L 70 -40 L 50 -100 L -50 -100 Z";
    }
    if (faceShape === 'round') {
      return "M -80 0 A 80 80 0 1 0 80 0 A 80 80 0 1 0 -80 0";
    }
    // Default Oval (Gender based)
    return gender === 'female' 
      ? "M -60 -40 C -70 40, -40 100, 0 110 C 40 100, 70 40, 60 -40 C 50 -100, -50 -100, -60 -40"
      : "M -70 -30 C -80 50, -50 110, 0 120 C 50 110, 80 50, 70 -30 C 60 -110, -60 -110, -70 -30";
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Deep Background Glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-[100px]"
        animate={{
          backgroundColor: glowColor,
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.svg
        viewBox="0 0 400 400"
        className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        initial={false}
      >
        <defs>
          <radialGradient id="faceGradient">
            <stop offset="0%" stopColor="rgba(0,0,0,0.8)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.95)" />
          </radialGradient>
        </defs>

        {/* Energy Strands (Hair/Aura) */}
        <g transform="translate(200, 200)">
          {strands.map((s) => (
            <motion.path
              key={s.id}
              d={`M 0 0 Q ${Math.cos(s.angle) * 50} ${Math.sin(s.angle) * 50} ${Math.cos(s.angle) * s.length} ${Math.sin(s.angle) * s.length}`}
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.6, 0],
                d: `M 0 0 Q ${Math.cos(s.angle + (sentiment * 0.2)) * (50 + fractalDepth * 50)} ${Math.sin(s.angle + (sentiment * 0.2)) * (50 + fractalDepth * 50)} ${Math.cos(s.angle) * (s.length + fractalDepth * 100)} ${Math.sin(s.angle) * (s.length + fractalDepth * 100)}`
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: s.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </g>

        {/* Face Shape */}
        <g transform="translate(200, 200)">
          <motion.path
            d={getFacePath()}
            fill="url(#faceGradient)"
            stroke={glowColor}
            strokeWidth="2"
            animate={{ 
              strokeOpacity: coherence,
              d: getFacePath()
            }}
          />

          {/* Eyes */}
          <g transform={`translate(0, ${-10 - sentiment * 5})`}>
            {/* Left Eye */}
            <motion.g transform="translate(-30, 0)">
              <circle r="8" fill="black" stroke={accentColor} strokeWidth="1" />
              <motion.circle 
                r="3" 
                fill={accentColor} 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.g>
            {/* Right Eye */}
            <motion.g transform="translate(30, 0)">
              <circle r="8" fill="black" stroke={accentColor} strokeWidth="1" />
              <motion.circle 
                r="3" 
                fill={accentColor} 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.g>
          </g>

          {/* Mouth */}
          <motion.path
            d={`M -20 50 Q 0 ${50 + sentiment * 15} 20 50`}
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              d: `M -20 50 Q 0 ${50 + sentiment * 15} 20 50`,
              opacity: stability
            }}
          />

          {/* Facial Highlights (Ethereal Glow) */}
          <motion.path
            d={gender === 'female' ? "M -40 -20 Q 0 -30 40 -20" : "M -50 -10 Q 0 -20 50 -10"}
            fill="none"
            stroke={accentColor}
            strokeWidth="0.5"
            strokeOpacity="0.3"
            animate={{ strokeOpacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </g>
      </motion.svg>
    </div>
  );
};
