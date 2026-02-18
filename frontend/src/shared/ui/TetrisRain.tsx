import React, { useEffect, useRef } from 'react';

interface TetrisRainProps {
    active: boolean;
    className?: string;
}

const SHAPES: number[][][] = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
];

const rotate = (shape: number[][]): number[][] => {
    const height = shape.length;
    const width = shape[0].length;
    const out: number[][] = Array.from({ length: width }, () => Array(height).fill(0));
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            out[x][height - 1 - y] = shape[y][x];
        }
    }
    return out;
};

const randomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

type Piece = {
    x: number;
    y: number;
    vy: number;
    size: number;
    shape: number[][];
    drift: number;
    opacity: number;
};

const TetrisRain: React.FC<TetrisRainProps> = ({ active, className }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!active || !canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) {
            return;
        }

        const reduceMotion =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const devicePixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

        const resize = (): void => {
            const parent = canvas.parentElement;
            const width = parent?.clientWidth ?? 640;
            const height = parent?.clientHeight ?? 220;
            canvas.width = Math.floor(width * devicePixelRatio);
            canvas.height = Math.floor(height * devicePixelRatio);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        };

        const spawnPiece = (): Piece => {
            let shape = SHAPES[randomInt(0, SHAPES.length - 1)];
            const rotations = randomInt(0, 3);
            for (let i = 0; i < rotations; i += 1) {
                shape = rotate(shape);
            }

            const size = randomInt(10, 16);
            const shapeWidth = shape[0].length * size;
            const parentWidth = canvas.parentElement?.clientWidth ?? 640;

            return {
                x: randomInt(0, Math.max(0, parentWidth - shapeWidth)),
                y: -randomInt(20, 120),
                vy: reduceMotion ? 35 : randomInt(60, 120),
                size,
                shape,
                drift: (Math.random() - 0.5) * (reduceMotion ? 4 : 14),
                opacity: 0.9,
            };
        };

        const drawPiece = (piece: Piece): void => {
            const cell = piece.size;
            context.save();
            context.globalAlpha = piece.opacity * 0.35;
            context.fillStyle = 'rgba(255,255,255,1)';
            context.strokeStyle = 'rgba(255,255,255,0.45)';
            context.lineWidth = 1;

            for (let y = 0; y < piece.shape.length; y += 1) {
                for (let x = 0; x < piece.shape[0].length; x += 1) {
                    if (!piece.shape[y][x]) continue;
                    const px = piece.x + x * cell;
                    const py = piece.y + y * cell;
                    context.fillRect(px, py, cell, cell);
                    context.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
                }
            }
            context.restore();
        };

        resize();
        const onResize = (): void => resize();
        window.addEventListener('resize', onResize);

        const pieces: Piece[] = Array.from({ length: 7 }, () => spawnPiece());
        let isRunning = true;
        let lastTick = performance.now();

        const tick = (now: number): void => {
            if (!isRunning) return;
            const dt = Math.min(0.033, (now - lastTick) / 1000);
            lastTick = now;

            const width = canvas.parentElement?.clientWidth ?? 640;
            const height = canvas.parentElement?.clientHeight ?? 220;
            context.clearRect(0, 0, width, height);

            for (let i = 0; i < pieces.length; i += 1) {
                const piece = pieces[i];
                piece.y += piece.vy * dt;
                piece.x += piece.drift * dt;

                if (piece.x < -40) piece.x = width + 40;
                if (piece.x > width + 40) piece.x = -40;

                const fadeStart = height * 0.75;
                if (piece.y > fadeStart) {
                    const normalized = Math.min(1, (piece.y - fadeStart) / (height - fadeStart));
                    piece.opacity = 0.9 * (1 - normalized);
                }

                drawPiece(piece);
                if (piece.y > height + 60 || piece.opacity <= 0.02) {
                    pieces[i] = spawnPiece();
                }
            }

            frameRef.current = window.requestAnimationFrame(tick);
        };

        frameRef.current = window.requestAnimationFrame(tick);

        return () => {
            isRunning = false;
            if (frameRef.current) {
                window.cancelAnimationFrame(frameRef.current);
            }
            window.removeEventListener('resize', onResize);
        };
    }, [active]);

    return <canvas ref={canvasRef} aria-hidden className={className} />;
};

export default TetrisRain;
