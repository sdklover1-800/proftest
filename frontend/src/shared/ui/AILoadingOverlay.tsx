import React, { useEffect, useState } from 'react';

import TetrisRain from './TetrisRain';

interface AILoadingOverlayProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    delayMs?: number;
}

const AILoadingOverlay: React.FC<AILoadingOverlayProps> = ({
    isOpen,
    title = 'AI is generating your dashboard',
    message = 'Analyzing signals and building recommendations...',
    delayMs = 500,
}) => {
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        let timer: number | null = null;
        if (!isOpen) {
            setIsVisible(false);
            return () => undefined;
        }
        timer = window.setTimeout(() => setIsVisible(true), delayMs);
        return () => {
            if (timer) {
                window.clearTimeout(timer);
            }
        };
    }, [isOpen, delayMs]);

    if (!isVisible) {
        return null;
    }

    const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
        <div className="fixed inset-0 z-[1200] overflow-hidden bg-black/60 backdrop-blur-sm">
            {!reduceMotion && (
                <TetrisRain active={isVisible} className="absolute inset-0 h-full w-full" />
            )}

            <div className="relative z-10 mx-auto mt-24 w-[min(720px,92vw)] rounded-2xl border border-white/10 bg-black/35 p-6">
                <div className="text-lg font-semibold text-white">{title}</div>
                <div className="mt-1 text-sm text-white/75">{message}</div>
                {reduceMotion && (
                    <div className="mt-3 text-sm text-white/70">
                        Working on it...
                    </div>
                )}
            </div>
        </div>
    );
};

export default AILoadingOverlay;
