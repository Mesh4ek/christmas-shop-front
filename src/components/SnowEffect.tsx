import { useEffect, useRef } from 'react';

interface Snowflake {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
}

interface SnowEffectProps {
    enabled: boolean;
}

const SnowEffect = ({ enabled }: SnowEffectProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const snowflakesRef = useRef<Snowflake[]>([]);

    useEffect(() => {
        if (!enabled) {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const initSnowflakes = () => {
            const count = Math.floor((canvas.width * canvas.height) / 15000);
            snowflakesRef.current = [];
            for (let i = 0; i < count; i++) {
                snowflakesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.5,
                });
            }
        };

        initSnowflakes();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            snowflakesRef.current.forEach((flake) => {
                flake.y += flake.speed;
                flake.x += Math.sin(flake.y * 0.01) * 0.5;

                if (flake.y > canvas.height) {
                    flake.y = -10;
                    flake.x = Math.random() * canvas.width;
                }

                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
                ctx.fill();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
            style={{ background: 'transparent' }}
        />
    );
};

export default SnowEffect;

