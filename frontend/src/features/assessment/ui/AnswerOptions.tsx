import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { getAnswerLayout, optionLabels } from '../model/answerLayout';
import type { LayoutQuestion } from '../model/answerLayout';
import { QuestionSymbol, SymbolRun } from './QuestionSymbols';

interface Props {
    question: LayoutQuestion;
    /** Position of the option already chosen, if any. */
    selectedValue?: number;
    onSelect: (optionIndex: number) => void;
}

/** Entrance stagger, so options arrive in order instead of all at once. */
const STAGGER_MS = 45;

const stagger = (index: number) => ({ animationDelay: `${index * STAGGER_MS}ms` });

const AnswerOptions: React.FC<Props> = ({ question, selectedValue, onSelect }) => {
    const { t, i18n } = useTranslation();
    const labels = optionLabels(question, i18n.language);
    const layout = getAnswerLayout(question, i18n.language);
    const answered = selectedValue !== undefined;

    if (labels.length === 0) {
        return null;
    }

    const isPicked = (index: number) => selectedValue === index;

    // A tap target big enough to hit under time pressure, plus its quieter twin.
    if (layout === 'go-no-go') {
        const [pressIndex, skipIndex] = [0, 1];
        return (
            <div className="w-full max-w-sm space-y-3">
                <button
                    type="button"
                    onClick={() => onSelect(pressIndex)}
                    disabled={answered}
                    style={stagger(0)}
                    className={classNames(
                        'animate-pop-in w-full rounded-3xl py-8 text-xl font-black tracking-wide text-primary-foreground shadow-lg transition-transform duration-100',
                        'active:scale-[0.97] disabled:opacity-60',
                        isPicked(pressIndex)
                            ? 'bg-primary ring-4 ring-primary/30'
                            : 'bg-primary/90 hover:bg-primary',
                    )}
                >
                    {labels[pressIndex]}
                </button>
                <button
                    type="button"
                    onClick={() => onSelect(skipIndex)}
                    disabled={answered}
                    style={stagger(1)}
                    className={classNames(
                        'animate-pop-in w-full rounded-2xl border py-4 text-base font-semibold transition-colors',
                        'active:scale-[0.98] disabled:opacity-60',
                        isPicked(skipIndex)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                >
                    {labels[skipIndex]}
                </button>
            </div>
        );
    }

    // Shapes stay shapes: picking "▲" from a row of drawings, not from a list.
    if (layout === 'glyph') {
        return (
            <div className="flex w-full max-w-sm flex-wrap items-center justify-center gap-4">
                {labels.map((label, index) => (
                    <button
                        key={`${question.code}-${index}`}
                        type="button"
                        onClick={() => onSelect(index)}
                        disabled={answered}
                        style={stagger(index)}
                        aria-label={label}
                        className={classNames(
                            'animate-pop-in flex size-24 items-center justify-center rounded-2xl border-2 bg-card shadow-sm transition-all duration-150',
                            'active:scale-95 disabled:opacity-60',
                            isPicked(index)
                                ? 'border-primary ring-4 ring-primary/25'
                                : 'border-border hover:border-primary/50 hover:shadow-md',
                        )}
                    >
                        <QuestionSymbol value={label} size="w-12 h-12" />
                    </button>
                ))}
            </div>
        );
    }

    // A pattern to continue is answered with a pattern, drawn the same way the
    // stimulus is drawn.
    if (layout === 'sequence') {
        return (
            <div className="w-full max-w-sm space-y-3">
                {labels.map((label, index) => (
                    <button
                        key={`${question.code}-${index}`}
                        type="button"
                        onClick={() => onSelect(index)}
                        disabled={answered}
                        style={stagger(index)}
                        aria-label={label}
                        className={classNames(
                            'animate-pop-in flex w-full items-center justify-center rounded-2xl border-2 bg-card py-5 transition-all duration-150',
                            'active:scale-[0.98] disabled:opacity-60',
                            isPicked(index)
                                ? 'border-primary ring-4 ring-primary/25'
                                : 'border-border hover:border-primary/50 hover:shadow-md',
                        )}
                    >
                        <SymbolRun value={label} size="w-8 h-8" gap="gap-4" />
                    </button>
                ))}
            </div>
        );
    }

    // Series answers and comparisons: the value itself, large enough to read at a glance.
    if (layout === 'compact') {
        return (
            <div className="flex w-full max-w-sm flex-wrap items-center justify-center gap-3">
                {labels.map((label, index) => (
                    <button
                        key={`${question.code}-${index}`}
                        type="button"
                        onClick={() => onSelect(index)}
                        disabled={answered}
                        style={stagger(index)}
                        className={classNames(
                            'animate-pop-in flex size-20 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all duration-150',
                            'active:scale-95 disabled:opacity-60',
                            isPicked(index)
                                ? 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/25'
                                : 'border-border bg-card text-foreground hover:border-primary/50 hover:shadow-md',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
        );
    }

    // Yes/no, same/different: two halves of one decision.
    if (layout === 'binary') {
        return (
            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                {labels.map((label, index) => (
                    <button
                        key={`${question.code}-${index}`}
                        type="button"
                        onClick={() => onSelect(index)}
                        disabled={answered}
                        style={stagger(index)}
                        className={classNames(
                            'animate-pop-in rounded-2xl border-2 px-3 py-7 text-base font-bold leading-tight transition-all duration-150',
                            'active:scale-95 disabled:opacity-60',
                            isPicked(index)
                                ? 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/25'
                                : 'border-border bg-card text-foreground hover:border-primary/50 hover:shadow-md',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
        );
    }

    // Situational answers stay a list — they are sentences — but each row gets
    // an accent bar and its own entrance, so the set reads as a set.
    return (
        <div className="w-full max-w-md space-y-3">
            {labels.map((label, index) => (
                <button
                    key={`${question.code}-${index}`}
                    type="button"
                    onClick={() => onSelect(index)}
                    disabled={answered}
                    style={stagger(index)}
                    className={classNames(
                        'animate-slide-up relative w-full overflow-hidden rounded-2xl border bg-card py-4 pl-6 pr-4 text-left shadow-sm transition-all duration-150',
                        'active:scale-[0.99] disabled:opacity-60',
                        isPicked(index)
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/40 hover:shadow-md',
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={classNames(
                            'absolute inset-y-0 left-0 w-1.5 transition-colors',
                            isPicked(index) ? 'bg-primary' : 'bg-border',
                        )}
                    />
                    <span
                        className={classNames(
                            'text-base font-medium',
                            isPicked(index) ? 'text-primary' : 'text-foreground',
                        )}
                    >
                        {label}
                    </span>
                </button>
            ))}
            <p className="pt-1 text-center text-xs text-muted-foreground">
                {t('assessment.pickOne', 'Выберите один вариант')}
            </p>
        </div>
    );
};

export default AnswerOptions;
