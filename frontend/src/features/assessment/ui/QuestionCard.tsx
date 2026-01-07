import React from 'react';
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

/**
 * Dumb UI component for rendering a single question.
 * Supports both 'scale' (1-5) and 'choice' (SJT options) types.
 */
const QuestionCard: React.FC<Props> = ({ question, selectedValue, onSelect }) => {
    const { t, i18n } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center flex-grow p-6 animate-fade-in">
            {/* Module Badge */}
            <div className="mb-8 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-wider uppercase">
                {question.module}
            </div>

            {/* Question Text - Localized */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8 leading-snug">
                {getLocalizedText(question, i18n.language)}
            </h2>

            {/* Scale Options (1-5) */}
            {question.type === 'scale' && (
                <div className="w-full max-w-sm">
                    <div className="flex justify-between gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                onClick={() => onSelect(value)}
                                className={classNames(
                                    "h-14 w-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-200",
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
                            className={classNames(
                                "w-full p-4 text-left rounded-xl border transition-all duration-200 shadow-sm bg-white",
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
                            className={classNames(
                                "w-full p-4 text-center rounded-xl border-2 transition-all duration-200",
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
