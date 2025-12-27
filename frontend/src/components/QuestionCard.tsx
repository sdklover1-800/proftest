import React from 'react';
// import { IonCard, IonCardContent, IonCardHeader } from '@ionic/react';
import type { Question } from '../store/assessmentStore';
import classNames from 'classnames';

interface Props {
    question: Question;
    selectedValue?: number;
    onSelect: (value: number) => void;
}

const QuestionCard: React.FC<Props> = ({ question, selectedValue, onSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center flex-grow p-6 animate-fade-in">
            {/* Module Badge */}
            <div className="mb-8 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-wider uppercase">
                {question.module}
            </div>

            {/* Question Text */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12 leading-relaxed">
                {question.text_ru}
            </h2>

            {/* Scale Options */}
            {question.type === 'scale' && (
                <div className="flex justify-between w-full max-w-sm px-2 gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            onClick={() => onSelect(value)}
                            className={classNames(
                                "w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 shadow-sm",
                                selectedValue === value
                                    ? "bg-blue-600 text-white scale-110 shadow-blue-300 shadow-lg ring-4 ring-blue-100"
                                    : "bg-white border-2 border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-500"
                            )}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            )}

            {/* Choice Options (Fallback for Cognitive) */}
            {question.type === 'choice' && (
                <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                    {[
                        { val: 1, label: 'Option A' },
                        { val: 2, label: 'Option B' },
                        { val: 3, label: 'Option C' },
                        { val: 4, label: 'Option D' }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => onSelect(opt.val)}
                            className={classNames(
                                "flex items-center justify-between w-full p-4 rounded-xl font-medium transition-all duration-300 shadow-sm border-2",
                                selectedValue === opt.val
                                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-blue-100"
                                    : "bg-white border-gray-100 text-gray-600 hover:border-blue-200 hover:text-blue-600"
                            )}
                        >
                            <span className="text-lg">{opt.label}</span>
                            {selectedValue === opt.val && (
                                <span className="text-blue-600 text-xl">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Scale Labels (Optional) */}
            {question.type === 'scale' && (
                <div className="flex justify-between w-full max-w-sm px-2 mt-4 text-xs text-gray-400 font-medium uppercase tracking-wide">
                    <span>Disagree</span>
                    <span>Agree</span>
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
