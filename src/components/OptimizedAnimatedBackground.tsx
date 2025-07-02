
import { useEffect, useRef, memo } from 'react';

interface OptimizedAnimatedBackgroundProps {
  className?: string;
}

const OptimizedAnimatedBackground = memo(({ className = "" }: OptimizedAnimatedBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mounted = true;

    const resize = () => {
      if (!canvas.parentElement || !mounted) return;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Recrear partículas solo si el tamaño cambió significativamente
      if (particlesRef.current.length === 0 || Math.abs(canvas.width - rect.width) > 50) {
        createParticles();
      }
    };

    const createParticles = () => {
      if (!canvas) return;
      
      const particles = [];
      const particleCount = Math.min(30, Math.max(10, Math.floor(canvas.width / 50)));
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.4 + 0.1
        });
      }
      
      particlesRef.current = particles;
    };

    const animate = () => {
      if (!mounted || !ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar partículas
      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Dibujar partícula
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
        ctx.fill();
      });
      
      // Conectar partículas cercanas (simplificado)
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        for (let j = i + 1; j < Math.min(i + 3, particlesRef.current.length); j++) {
          const other = particlesRef.current[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 80) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - distance / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      
      if (mounted) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    resize();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (mounted) {
        setTimeout(resize, 100); // Debounce resize
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: 'transparent' }}
    />
  );
});

OptimizedAnimatedBackground.displayName = 'OptimizedAnimatedBackground';

export default OptimizedAnimatedBackground;
