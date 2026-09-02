'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  x: number; y: number; r: number;
  vx: number; vy: number;
  alpha: number; phase: number; twinkle: number; hue: number;
};

// 首页暗色氛围背景：深蓝黑渐变 + 缓慢上浮、呼吸闪烁的空灵光点
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;

    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.floor((width * height) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(0.04 + Math.random() * 0.16),
        alpha: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.4 + Math.random() * 0.9,
        hue: 235 + Math.random() * 55, // 蓝紫 → 品红
      }));
    };

    const render = (time: number) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -12) { p.y = height + 12; p.x = Math.random() * width; }
        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;
        const glow = 0.55 + 0.45 * Math.sin(t * p.twinkle + p.phase);
        const a = Math.max(0, p.alpha * glow);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 84%, ${a})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 78%, ${a})`;
        ctx.shadowBlur = p.r * 5;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const loop = (time: number) => { render(time); raf = requestAnimationFrame(loop); };

    seed();
    if (reduceMotion) render(0);
    else raf = requestAnimationFrame(loop);
    window.addEventListener('resize', seed);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', seed); };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 深蓝黑底色 */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(165deg, oklch(0.18 0.035 272) 0%, oklch(0.135 0.025 262) 48%, oklch(0.10 0.025 285) 100%)' }} />
      {/* 顶部紫色光晕 */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(62% 48% at 72% -6%, rgba(139, 124, 255, 0.20), transparent 70%)' }} />
      {/* 左下青色微光 */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(48% 42% at 12% 108%, rgba(56, 189, 248, 0.10), transparent 70%)' }} />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}