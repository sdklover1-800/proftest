import React, { useEffect, useRef, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IonPage, IonContent } from '@ionic/react';
import AssessmentLayout from './AssessmentLayout';
import QuestionCard from './QuestionCard';
import { useAssessment } from '../model/useAssessment';
import { getCognitiveTimeLimitMs } from '../model/assessmentTiming';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';

/**
 * Assessment page - ultra-thin wrapper.
 * All logic is in useAssessment hook, this only renders.
 */
const AssessmentPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        isLoading,
        isFinished,
        currentQuestion,
        currentIndex,
        totalQuestions,
        responses,
        progress,
        moduleProgress,
        moduleIndex,
        moduleTotal,
        handleSelect,
        isBreakVisible,
        breakCountdown,
        skipBreak,
        isInstructionVisible,
        instructionCountdown,
        feedbackType,
        showFeedback,
        lastReactionTimeMs,
        showReactionTime,
        isModulePromptVisible,
        nextModule,
        continueToNextModule,
        finishAssessmentEarly,
        retry
    } = useAssessment();

    const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
    const [isPracticeVisible, setIsPracticeVisible] = useState(false);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const cognitivePracticeDoneRef = useRef(false);

    useEffect(() => {
        if (!currentQuestion || isInstructionVisible || isBreakVisible || isPracticeVisible) {
            setTimeLeftMs(null);
            return;
        }

        const timeLimitMs = getCognitiveTimeLimitMs(currentQuestion);
        if (!timeLimitMs) {
            setTimeLeftMs(null);
            return;
        }

        const startTime = Date.now();
        setTimeLeftMs(timeLimitMs);

        const intervalId = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(timeLimitMs - elapsed, 0);
            setTimeLeftMs(remaining);
            if (remaining <= 0) {
                window.clearInterval(intervalId);
            }
        }, 100);

        return () => window.clearInterval(intervalId);
    }, [currentQuestion?.id, isInstructionVisible, isBreakVisible, isPracticeVisible]);

    useEffect(() => {
        // Only show practice for COGNITIVE module
        if (currentQuestion?.module === 'COGNITIVE' && !cognitivePracticeDoneRef.current) {
            setIsPracticeVisible(true);
            setPracticeIndex(0);
        }
    }, [currentQuestion?.module]);

    const handleClose = () => {
        if (window.confirm(t('assessment.exit_confirm'))) {
            window.location.href = '/home';
        }
    };

    if (isLoading) {
        return (
            <AssessmentLayout>
                <div className="flex items-center justify-center h-full">
                    {/* Keep content centered, overlay will handle the spinner */}
                    <LoadingOverlay isOpen={isLoading} />
                </div>
            </AssessmentLayout>
        );
    }

    if (isFinished) {
        return <Redirect to="/results" />;
    }

    if (!currentQuestion) {
        return (
            <AssessmentLayout>
                <div className="p-8 text-center mt-20">
                    <p className="text-gray-500">{t('assessment.no_questions')}</p>
                    <button onClick={retry} className="mt-4 text-blue-600 font-semibold">
                        {t('assessment.retry')}
                    </button>
                </div>
            </AssessmentLayout>
        );
    }

    const practiceItems = [
        {
            key: 'speed',
            text: t('assessment.practice.items.speed.text'),
            options: [
                t('assessment.practice.items.speed.options.match'),
                t('assessment.practice.items.speed.options.different')
            ]
        },
        {
            key: 'memory',
            text: t('assessment.practice.items.memory.text'),
            options: [
                t('assessment.practice.items.memory.options.yes'),
                t('assessment.practice.items.memory.options.no')
            ]
        },
        {
            key: 'go',
            text: t('assessment.practice.items.go.text'),
            options: [
                t('assessment.practice.items.go.options.press'),
                t('assessment.practice.items.go.options.skip')
            ]
        }
    ];

    const handlePracticeSelect = () => {
        const nextIndex = practiceIndex + 1;
        if (nextIndex >= practiceItems.length) {
            cognitivePracticeDoneRef.current = true;
            setIsPracticeVisible(false);
        } else {
            setPracticeIndex(nextIndex);
        }
    };

    const instructionTextMap: Record<string, string> = {
        RIASEC: t('assessment.instructions.riasec'),
        BIG5: t('assessment.instructions.big5'),
        SJT: t('assessment.instructions.sjt'),
        COGNITIVE: t('assessment.instructions.cognitive'),
    };
    const instructionText = instructionTextMap[currentQuestion.module] || t('assessment.instructions.default');

    const moduleLabelMap: Record<string, string> = {
        RIASEC: t('assessment.module_names.riasec'),
        BIG5: t('assessment.module_names.big5'),
        SJT: t('assessment.module_names.sjt'),
        COGNITIVE: t('assessment.module_names.cognitive'),
    };
    const currentModuleLabel = moduleLabelMap[currentQuestion.module] || currentQuestion.module;
    const nextModuleLabel = nextModule ? (moduleLabelMap[nextModule] || nextModule) : '';
    const currentPractice = practiceItems[practiceIndex];

    const timeLimitMs = getCognitiveTimeLimitMs(currentQuestion);
    const timeProgress = timeLeftMs !== null && timeLimitMs ? timeLeftMs / timeLimitMs : null;

    const renderPracticeIcons = (key?: string) => {
        if (key === 'speed') {
            return (
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg animate-pulse">
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                            <path d="M12 4l8 14H4l8-14z" />
                        </svg>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-200 to-indigo-400 text-white flex items-center justify-center shadow-md animate-pulse">
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                            <rect x="4" y="4" width="16" height="16" rx="3" />
                        </svg>
                    </div>
                </div>
            );
        }

        if (key === 'memory') {
            return (
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md animate-bounce" />
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md animate-bounce" />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-md animate-bounce" />
                </div>
            );
        }

        if (key === 'go') {
            return (
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg animate-ping" />
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-inner opacity-70" />
                </div>
            );
        }

        return null;
    };

    return (
        <IonPage className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors animate-fade-in">
            {/* Custom Header with Thick Progress Bar */}
            <div className="bg-white dark:bg-gray-800 shadow-sm z-10 transition-colors">
                <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="text-sm font-semibold text-gray-500">
                        {t('assessment.question_count', { current: currentIndex + 1, total: totalQuestions })}
                    </div>
                    {timeLeftMs !== null && (
                        <div className="text-sm font-semibold text-red-500">
                            {t('assessment.timer', { seconds: Math.ceil(timeLeftMs / 1000) })}
                        </div>
                    )}
                    {showReactionTime && lastReactionTimeMs !== null && (
                        <div className="text-xs font-semibold text-indigo-500">
                            {t('assessment.reaction_time', { ms: lastReactionTimeMs })}
                        </div>
                    )}
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600">
                        {/* Close Icon SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* Thick Progress Bar */}
                <div className="w-full h-3 bg-gray-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
                {/* Module Progress Bar */}
                {moduleTotal > 0 && (
                    <div className="w-full h-1 bg-gray-100">
                        <div
                            className="h-full bg-indigo-400 transition-all duration-500 ease-out"
                            style={{ width: `${moduleProgress * 100}%` }}
                        />
                    </div>
                )}
                {/* Timer Progress Bar */}
                {timeProgress !== null && (
                    <div className="w-full h-1 bg-red-50">
                        <div
                            className="h-full bg-red-400 transition-all duration-100 ease-linear"
                            style={{ width: `${timeProgress * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Feedback Flash */}
            {showFeedback && feedbackType && (
                <div
                    className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-200 backdrop-blur-sm ${
                        feedbackType === 'correct' ? 'bg-green-200/15' : 'bg-red-200/15'
                    }`}
                />
            )}

            <IonContent className="bg-gray-50 dark:bg-gray-900 transition-colors">
                {/* Mobile Container - Vertically Centered */}
                <div className="min-h-[80vh] flex flex-col justify-center max-w-md mx-auto px-4 pb-12">
                    {moduleTotal > 0 && (
                        <div className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">
                            {t('assessment.module_progress', { current: moduleIndex + 1, total: moduleTotal })}
                        </div>
                    )}
                    {isBreakVisible ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-3">
                                {t('assessment.break.title')}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">{currentQuestion.module}</h2>
                            <p className="text-gray-600 mb-6">{t('assessment.break.description')}</p>
                            <div className="text-sm font-semibold text-gray-500 mb-6">
                                {t('assessment.break.countdown', { seconds: breakCountdown })}
                            </div>
                            <button
                                onClick={skipBreak}
                                className="px-6 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold"
                            >
                                {t('assessment.break.continue')}
                            </button>
                        </div>
                    ) : isInstructionVisible ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-3">
                                {t('assessment.instructions.title')}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">{currentQuestion.module}</h2>
                            <p className="text-gray-600 mb-6">{instructionText}</p>
                            <div className="text-sm font-semibold text-gray-500">
                                {t('assessment.instructions.countdown', { seconds: instructionCountdown })}
                            </div>
                        </div>
                    ) : isModulePromptVisible ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-3">
                                {t('assessment.module_end.title', { module: currentModuleLabel })}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">{currentModuleLabel}</h2>
                            <p className="text-gray-600 mb-6">
                                {t('assessment.module_end.question', { nextModule: nextModuleLabel })}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={finishAssessmentEarly}
                                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold"
                                >
                                    {t('assessment.module_end.finish')}
                                </button>
                                <button
                                    onClick={continueToNextModule}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
                                >
                                    {t('assessment.module_end.continue')}
                                </button>
                            </div>
                        </div>
                    ) : isPracticeVisible && currentQuestion.module === 'COGNITIVE' ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-3">
                                {t('assessment.practice.title')}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">
                                {t('assessment.practice.step', { current: practiceIndex + 1, total: practiceItems.length })}
                            </h2>
                            {renderPracticeIcons(currentPractice?.key)}
                            <p className="text-gray-600 mb-6">{currentPractice?.text}</p>
                            <div className="space-y-3">
                                {currentPractice?.options.map((label, idx) => (
                                    <button
                                        key={`practice-${currentPractice.key}-${idx}`}
                                        onClick={handlePracticeSelect}
                                        className="w-full p-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-indigo-400"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <QuestionCard
                            question={currentQuestion}
                            selectedValue={responses[currentQuestion.id]}
                            onSelect={handleSelect}
                        />
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AssessmentPage;
