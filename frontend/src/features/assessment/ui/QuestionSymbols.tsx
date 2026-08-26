import React from 'react';

/**
 * The shape vocabulary used by the cognitive block, drawn rather than typed.
 *
 * Shared by the stimulus above the question and the answer tiles below it, so
 * the same glyph never renders as a drawing in one place and as text in the other.
 */
const SHAPES: Record<string, (size: string) => React.ReactNode> = {
    '▲': (s) => <div className={`${s} bg-blue-500`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />,
    '▼': (s) => <div className={`${s} bg-blue-500`} style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }} />,
    '●': (s) => <div className={`${s} rounded-full bg-rose-500`} />,
    '○': (s) => <div className={`${s} rounded-full border-4 border-rose-500`} />,
    '■': (s) => <div className={`${s} rounded-sm bg-emerald-500`} />,
    '□': (s) => <div className={`${s} rounded-sm border-4 border-emerald-500`} />,
    '◆': (s) => <div className={`${s} rotate-45 bg-violet-500`} />,
    '◇': (s) => <div className={`${s} rotate-45 border-4 border-violet-500`} />,
    '★': (s) => <div className={`${s} bg-amber-400`} style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />,
    '☆': (s) => <div className={`${s} border-4 border-amber-400`} style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />,
    '🟢': (s) => <div className={`${s} rounded-full bg-emerald-500 shadow-lg`} />,
    '🔴': (s) => <div className={`${s} rounded-full bg-rose-500 shadow-lg`} />,
};

interface SymbolProps {
    value: string;
    /** Tailwind size classes, e.g. "w-10 h-10". */
    size?: string;
    className?: string;
}

/** Draws `value` as a shape, falling back to the character itself. */
export const QuestionSymbol: React.FC<SymbolProps> = ({ value, size = 'w-10 h-10', className = '' }) => {
    const draw = SHAPES[value.trim()];
    return (
        <span className={`inline-flex items-center justify-center ${className}`}>
            {draw ? draw(size) : <span className="text-3xl font-bold text-foreground">{value}</span>}
        </span>
    );
};

interface RunProps {
    /** Space-separated glyphs, e.g. "■ ● ●". */
    value: string;
    size?: string;
    gap?: string;
}

/** Draws a whole pattern, so a series reads as shapes rather than as text. */
export const SymbolRun: React.FC<RunProps> = ({ value, size = 'w-6 h-6', gap = 'gap-2' }) => (
    <span className={`inline-flex items-center ${gap}`}>
        {value.trim().split(/\s+/).map((glyph, index) => (
            <QuestionSymbol key={`${glyph}-${index}`} value={glyph} size={size} />
        ))}
    </span>
);

export default QuestionSymbol;
