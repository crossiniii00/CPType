import React, { useEffect, useRef } from 'react';

const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()';
    const fontSize = 24;
    let columns = 0;
    let drops: number[] = [];

    const resetDrops = () => {
      columns = Math.ceil(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() > 0.58 ? Math.random() * -120 : -9999);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      resetDrops();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.065)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(11, 58, 120, 0.16)';
      ctx.font = `${fontSize}px monospace`;
      ctx.shadowColor = 'rgba(11, 58, 120, 0.12)';
      ctx.shadowBlur = 6;

      for (let i = 0; i < drops.length; i++) {
        if (drops[i] < -1000) {
          if (Math.random() > 0.9985) drops[i] = 0;
          continue;
        }

        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height) {
          drops[i] = Math.random() > 0.985 ? 0 : -9999;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ filter: 'blur(0.7px)', mixBlendMode: 'screen', opacity: 0.42 }}
    />
  );
};

export default MatrixBackground;
