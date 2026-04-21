import { motion } from 'framer-motion';

export default function DustClouds() {
  const clouds = [
    { id: 1, cx: '-10%', cy: '20%', rx: '80vw', ry: '40vh', delay: 0, duration: 25 },
    { id: 2, cx: '30%', cy: '50%', rx: '90vw', ry: '30vh', delay: 5, duration: 30 },
    { id: 3, cx: '60%', cy: '10%', rx: '70vw', ry: '50vh', delay: 2, duration: 28 },
  ];

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
      {clouds.map((cloud) => (
        <motion.div
          key={cloud.id}
          className="absolute rounded-[100%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-accent/5 to-transparent"
          style={{
            left: cloud.cx,
            top: cloud.cy,
            width: cloud.rx,
            height: cloud.ry,
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{
            x: ['0%', '15%', '-15%', '0%'],
            y: ['0%', '-15%', '10%', '0%'],
            rotate: [0, 15, -15, 0],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.9, 0.8]
          }}
          transition={{
            duration: cloud.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: cloud.delay,
          }}
        />
      ))}
    </div>
  );
}
