import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { getLocalizedText } from '@/utils/langUtils';

interface QuestionOption {
    text: string;
    value: number;
}

interface Question {
    id: number;
    code: string;
    module: string;
    type: string;
    text_ru: string;
    text_kz?: string;
    text_en?: string;
    options?: QuestionOption[];
}

interface Props {
    question: Question;
    selectedValue?: number;
    onSelect: (value: number) => void;
}

// Symbol to visual shape mapping
const symbolShapes: Record<string, React.ReactNode> = {
    '▲': <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] border-l-transparent border-r-transparent border-b-blue-500" />,
    '▼': <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[35px] border-l-transparent border-r-transparent border-t-blue-500" />,
    '●': <div className="w-10 h-10 rounded-full bg-red-500" />,
    '○': <div className="w-10 h-10 rounded-full border-4 border-red-500 bg-white" />,
    '■': <div className="w-10 h-10 bg-green-500 rounded-sm" />,
    '□': <div className="w-10 h-10 border-4 border-green-500 bg-white rounded-sm" />,
    '◆': <div className="w-10 h-10 bg-purple-500 rotate-45" />,
    '◇': <div className="w-10 h-10 border-4 border-purple-500 bg-white rotate-45" />,
    '★': <div className="text-4xl text-yellow-500">★</div>,
    '☆': <div className="text-4xl text-yellow-500">☆</div>,
    '🟢': <div className="w-16 h-16 rounded-full bg-green-500 shadow-lg animate-pulse" />,
    '🔴': <div className="w-16 h-16 rounded-full bg-red-500 shadow-lg" />,
};

// Parse symbols from question text
const extractSymbols = (text: string): string[] => {
    const symbolRegex = /[▲▼●○■□◆◇★☆🟢🔴]/g;
    return text.match(symbolRegex) || [];
};

// Detect cognitive question subtype
type CognitiveSubtype = 'go-nogo' | 'compare-symbols' | 'find-symbol' | 'compare-values' | 'match-symbol' | 'memory' | 'logic' | 'generic';

const getCognitiveSubtype = (code: string): CognitiveSubtype => {
    if (code.startsWith('COG_GO_')) return 'go-nogo';
    if (code.startsWith('COG_A_')) return 'compare-symbols';
    if (code.startsWith('COG_B_')) return 'find-symbol';
    if (code.startsWith('COG_C_')) return 'compare-values';
    if (code.startsWith('COG_D_')) return 'match-symbol';
    if (code.startsWith('COG_MEM_')) return 'memory';
    if (code.startsWith('COG_LOG_')) return 'logic';
    return 'generic';
};

/**
 * Dumb UI component for rendering a single question.
 * Supports both 'scale' (1-5) and 'choice' (SJT options) types.
 * Special visual rendering for COGNITIVE module questions.
 */
const QuestionCard: React.FC<Props> = ({ question, selectedValue, onSelect }) => {
    const { t, i18n } = useTranslation();

    const questionText = getLocalizedText(question, i18n.language);
    const isCognitive = question.module === 'COGNITIVE';
    const cognitiveSubtype = useMemo(() => isCognitive ? getCognitiveSubtype(question.code) : null, [isCognitive, question.code]);
    const symbols = useMemo(() => extractSymbols(questionText), [questionText]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) {
                return;
            }
            if (selectedValue !== undefined) {
                return;
            }
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
                return;
            }

            if (question.type === 'scale') {
                const numericValue = Number(event.key);
                if (numericValue >= 1 && numericValue <= 5) {
                    onSelect(numericValue);
                }
                return;
            }

            if (question.type !== 'choice') {
                return;
            }

            const options = question.options ?? [];
            const isGoNoGo = question.code?.startsWith('COG_GO_');

            if (isGoNoGo && options.length > 0) {
                const pressOption = options.find((opt) => /press|наж|нажать/i.test(opt.text));
                const skipOption = options.find((opt) => /skip|пропус|пропустить/i.test(opt.text));

                if (event.code === 'Space' && pressOption) {
                    event.preventDefault();
                    onSelect(pressOption.value);
                    return;
                }

                if ((event.key === '0' || event.key.toLowerCase() === 'n') && skipOption) {
                    onSelect(skipOption.value);
                }

                return;
            }

            if (options.length > 0) {
                const index = Number(event.key) - 1;
                if (!Number.isNaN(index) && index >= 0 && index < options.length) {
                    onSelect(options[index].value);
                }
                return;
            }

            const fallbackIndex = Number(event.key) - 1;
            if (!Number.isNaN(fallbackIndex) && fallbackIndex >= 0 && fallbackIndex < 4) {
                onSelect(fallbackIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [question, onSelect, selectedValue]);

    // Render visual symbols from question text
    const renderSymbol = (symbol: string, index: number) => {
        const shape = symbolShapes[symbol];
        return shape ? (
            <div key={index} className="flex items-center justify-center">
                {shape}
            </div>
        ) : (
            <span key={index} className="text-4xl font-bold">{symbol}</span>
        );
    };

    // Render Go/No-Go visual game
    const renderGoNoGo = () => {
        const isGo = questionText.includes('🟢') || questionText.toLowerCase().includes('green') || questionText.includes('Зеленый') || questionText.includes('Жасыл');
        const isNoGo = questionText.includes('🔴') || questionText.toLowerCase().includes('red') || questionText.includes('Красный') || questionText.includes('Қызыл');
        
        return (
            <div className="flex flex-col items-center gap-6 mb-8">
                {isGo && (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-2xl animate-pulse flex items-center justify-center">
                        <span className="text-white text-lg font-bold">GO</span>
                    </div>
                )}
                {isNoGo && (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-2xl flex items-center justify-center">
                        <span className="text-white text-lg font-bold">STOP</span>
                    </div>
                )}
                <p className="text-sm text-gray-500">
                    {isGo ? t('assessment.cognitive.pressSpace', 'Press SPACE to respond') : t('assessment.cognitive.dontPress', 'Do NOT press - wait')}
                </p>
            </div>
        );
    };

    // Render symbol comparison (COG_A): "▲ и ▲"
    const renderCompareSymbols = () => {
        if (symbols.length < 2) return null;
        return (
            <div className="flex items-center justify-center gap-8 mb-8">
                {renderSymbol(symbols[0], 0)}
                <span className="text-3xl text-gray-400 font-light">vs</span>
                {renderSymbol(symbols[1], 1)}
            </div>
        );
    };

    // Render find symbol (COG_B): "Есть ли ★ среди: ▲ ■ ★ ●"
    const renderFindSymbol = () => {
        const targetSymbol = '★';
        const setSymbols = symbols.filter(s => s !== targetSymbol || symbols.indexOf(s) > 0);
        
        return (
            <div className="flex flex-col items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-600">{t('assessment.cognitive.findTarget', 'Find:')}</span>
                    <div className="text-5xl text-yellow-500">★</div>
                </div>
                <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl">
                    {setSymbols.slice(0, 4).map((s, i) => renderSymbol(s, i))}
                </div>
            </div>
        );
    };

    // Render compare values (COG_C): "7 — 9"
    const renderCompareValues = () => {
        const match = questionText.match(/:\s*([A-Za-z0-9]+)\s*[—-]\s*([A-Za-z0-9]+)/);
        if (!match) return null;
        const [, left, right] = match;
        
        return (
            <div className="flex items-center justify-center gap-8 mb-8">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">{left}</span>
                </div>
                <span className="text-3xl text-gray-400 font-light">vs</span>
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">{right}</span>
                </div>
            </div>
        );
    };

    // Render match symbol (COG_D): "Найдите пару для: ▲"
    const renderMatchSymbol = () => {
        if (symbols.length === 0) return null;
        const targetSymbol = symbols[0];
        
        return (
            <div className="flex flex-col items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-600">{t('assessment.cognitive.matchTarget', 'Match:')}</span>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shadow-lg border-4 border-indigo-300">
                    {renderSymbol(targetSymbol, 0)}
                </div>
            </div>
        );
    };

    // Render memory task (COG_MEM): sequences, chains
    const renderMemory = () => {
        // Extract sequence elements
        const seqMatch = questionText.match(/[Цепочка|Ряд|Sequence|Initial|Было].*?[:：]\s*([^\.\?]+)/i);
        if (!seqMatch) return null;
        
        const seqText = seqMatch[1].trim();
        const elements = seqText.split(/\s+/).filter(e => e.length > 0);
        
        return (
            <div className="flex flex-col items-center gap-6 mb-8">
                <div className="text-sm text-gray-500 uppercase tracking-wide">{t('assessment.cognitive.remember', 'Remember the sequence')}</div>
                <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                    {elements.slice(0, 5).map((el, i) => (
                        <div key={i} className="w-14 h-14 rounded-lg bg-white shadow-md flex items-center justify-center border border-gray-200">
                            {symbolShapes[el] ? renderSymbol(el, i) : <span className="text-2xl font-bold text-gray-700">{el}</span>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render logic task (COG_LOG): series, matrices
    const renderLogic = () => {
        // Try to extract series
        const seriesMatch = questionText.match(/(\d+|[A-Z]|[▲●■◆★])\s*→\s*(\d+|[A-Z]|[▲●■◆★])\s*→\s*(\d+|[A-Z]|[▲●■◆★])/);
        if (seriesMatch) {
            const elements = questionText.match(/(\d+|[A-Z]|[▲●■◆★])\s*→/g)?.map(m => m.replace('→', '').trim()) || [];
            
            return (
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="text-sm text-gray-500 uppercase tracking-wide">{t('assessment.cognitive.continuePattern', 'Continue the pattern')}</div>
                    <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        {elements.slice(0, 4).map((el, i) => (
                            <React.Fragment key={i}>
                                <div className="w-12 h-12 rounded-lg bg-white shadow-md flex items-center justify-center border border-blue-200">
                                    {symbolShapes[el] ? renderSymbol(el, i) : <span className="text-xl font-bold text-gray-700">{el}</span>}
                                </div>
                                {i < elements.length - 1 && <span className="text-xl text-blue-400">→</span>}
                            </React.Fragment>
                        ))}
                        <span className="text-xl text-blue-400">→</span>
                        <div className="w-12 h-12 rounded-lg bg-blue-100 shadow-md flex items-center justify-center border-2 border-blue-400 border-dashed">
                            <span className="text-2xl font-bold text-blue-400">?</span>
                        </div>
                    </div>
                </div>
            );
        }
        
        return null;
    };

    // Get cognitive visual based on subtype
    const renderCognitiveVisual = () => {
        switch (cognitiveSubtype) {
            case 'go-nogo': return renderGoNoGo();
            case 'compare-symbols': return renderCompareSymbols();
            case 'find-symbol': return renderFindSymbol();
            case 'compare-values': return renderCompareValues();
            case 'match-symbol': return renderMatchSymbol();
            case 'memory': return renderMemory();
            case 'logic': return renderLogic();
            default: return null;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center flex-grow p-6 animate-fade-in">
            {/* Module Badge */}
            <div className={classNames(
                "mb-6 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase",
                isCognitive ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
            )}>
                {question.module}
                {cognitiveSubtype && cognitiveSubtype !== 'generic' && (
                    <span className="ml-2 text-gray-400">• {cognitiveSubtype.replace('-', '/')}</span>
                )}
            </div>

            {/* Cognitive Visual */}
            {isCognitive && renderCognitiveVisual()}

            {/* Question Text - Localized (smaller for cognitive with visuals) */}
            <h2 className={classNames(
                "font-bold text-center text-gray-900 mb-8 leading-snug",
                isCognitive && cognitiveSubtype !== 'generic' ? "text-lg" : "text-2xl"
            )}>
                {questionText}
            </h2>

            {/* Scale Options (1-5) */}
            {question.type === 'scale' && (
                <div className="w-full max-w-sm">
                    <div className="flex justify-between gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                onClick={() => onSelect(value)}
                                disabled={selectedValue !== undefined}
                                className={classNames(
                                    "h-14 w-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
                                    selectedValue === value
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md scale-110"
                                        : "bg-white border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                                )}
                            >
                                {value}
                            </button>
                        ))}
                    </div>

                    {/* Scale Labels */}
                    <div className="flex justify-between px-1">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            {t('assessment.disagree')}
                        </span>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            {t('assessment.agree')}
                        </span>
                    </div>
                </div>
            )}

            {/* Choice Options (SJT - Dynamic from API) */}
            {question.type === 'choice' && question.options && question.options.length > 0 && (
                <div className="w-full max-w-md space-y-3">
                    {question.options.map((opt, index) => (
                        <button
                            key={`${question.id}-opt-${index}`}
                            onClick={() => onSelect(opt.value)}
                            disabled={selectedValue !== undefined}
                            className={classNames(
                                "w-full p-4 text-left rounded-xl border transition-all duration-200 shadow-sm bg-white disabled:opacity-60 disabled:cursor-not-allowed",
                                selectedValue === opt.value
                                    ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300"
                            )}
                        >
                            <span className={classNames(
                                "text-base font-medium",
                                selectedValue === opt.value ? "text-blue-900" : "text-gray-700"
                            )}>
                                {opt.text}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Fallback for choice without options (legacy) */}
            {question.type === 'choice' && (!question.options || question.options.length === 0) && (
                <div className="w-full max-w-sm space-y-3">
                    {[
                        { val: 1, label: 'A' },
                        { val: 2, label: 'B' },
                        { val: 3, label: 'C' },
                        { val: 4, label: 'D' }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => onSelect(opt.val)}
                            disabled={selectedValue !== undefined}
                            className={classNames(
                                "w-full p-4 text-center rounded-xl border-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
                                selectedValue === opt.val
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-400"
                            )}
                        >
                            <span className="text-lg font-bold">{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
