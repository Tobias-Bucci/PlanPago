import React, { useRef, useEffect } from "react";

// Settings
const PARTICLE_COUNT = 60;
const PARTICLE_COLOR = "#61dafb";
const LINE_COLOR = "#e1b7e9";
const LINE_WIDTH = 1.1;
const PARTICLE_RADIUS = 2.2;
const CONNECT_DIST = 120; // px
const PARTICLE_SPEED = 0.25;

function random(min, max) {
    return Math.random() * (max - min) + min;
}

export default function AnimatedParticlesParallax() {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const mouse = useRef({ x: null, y: null });
    const animationRef = useRef();

    // Scroll detection for scrollbar animation
    useEffect(() => {
        let scrollTimeout;
        const handleScroll = () => {
            document.body.classList.add('scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('scrolling');
            }, 1000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, []);

    // Resize canvas to fill parent
    useEffect(() => {
        const canvas = canvasRef.current;
        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // Mouse tracking
    useEffect(() => {
        const handle = (e) => {
            const rect = canvasRef.current.getBoundingClientRect();
            mouse.current.x = e.clientX - rect.left;
            mouse.current.y = e.clientY - rect.top;
        };
        const leave = () => {
            mouse.current.x = null;
            mouse.current.y = null;
        };
        window.addEventListener("mousemove", handle);
        window.addEventListener("mouseout", leave);
        return () => {
            window.removeEventListener("mousemove", handle);
            window.removeEventListener("mouseout", leave);
        };
    }, []);

    // Init particles
    useEffect(() => {
        const canvas = canvasRef.current;
        const w = canvas.width = canvas.offsetWidth;
        const h = canvas.height = canvas.offsetHeight;
        particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: random(0, w),
            y: random(0, h),
            vx: random(-PARTICLE_SPEED, PARTICLE_SPEED),
            vy: random(-PARTICLE_SPEED, PARTICLE_SPEED),
        }));
    }, []);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let w = canvas.width = canvas.offsetWidth;
        let h = canvas.height = canvas.offsetHeight;

        function animate() {
            ctx.clearRect(0, 0, w, h);
            // Move particles
            for (const p of particles.current) {
                p.x += p.vx;
                p.y += p.vy;
                // Bounce at edges
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }
            // Draw lines
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                    const a = particles.current[i];
                    const b = particles.current[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECT_DIST) {
                        ctx.strokeStyle = LINE_COLOR;
                        ctx.globalAlpha = 1 - dist / CONNECT_DIST;
                        ctx.lineWidth = LINE_WIDTH;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
            // Draw particles
            for (const p of particles.current) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = PARTICLE_COLOR;
                ctx.shadowColor = PARTICLE_COLOR;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            // Mouse interaction: draw lines to mouse, attract/repel
            if (mouse.current.x !== null && mouse.current.y !== null) {
                for (const p of particles.current) {
                    const dx = p.x - mouse.current.x;
                    const dy = p.y - mouse.current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECT_DIST) {
                        ctx.strokeStyle = PARTICLE_COLOR;
                        ctx.globalAlpha = 1 - dist / CONNECT_DIST;
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.current.x, mouse.current.y);
                        ctx.stroke();
                        // Option: leichte Anziehung/Abstoßung
                        const force = (CONNECT_DIST - dist) / CONNECT_DIST * 0.03;
                        p.vx += (dx > 0 ? -1 : 1) * force * Math.random();
                        p.vy += (dy > 0 ? -1 : 1) * force * Math.random();
                    }
                }
                ctx.globalAlpha = 1;
            }
            animationRef.current = requestAnimationFrame(animate);
        }
        animate();
        return () => cancelAnimationFrame(animationRef.current);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "auto",
                background: "transparent"
            }}
            aria-hidden="true"
        />
    );
}
