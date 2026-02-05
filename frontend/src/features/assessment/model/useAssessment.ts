import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useAssessmentQuestions, useStartSession, useSubmitAnswer } from '../api/queries';
import { getCognitiveTimeLimitMs, isGoNoGoQuestion, isNoGoStimulus } from './assessmentTiming';

interface Question {
    id: number;
    code: string;
    module: string;
    type: string;
    text_ru: string;
    text_kz?: string;
    text_en?: string;
    options?: { text: string; value: number }[];
}

interface UseAssessmentReturn {
    isLoading: boolean;
    isFinished: boolean;
    currentQuestion: Question | undefined;
    currentIndex: number;
    totalQuestions: number;
    responses: Record<number, number>;
    progress: number;
    moduleProgress: number;
    moduleIndex: number;
    moduleTotal: number;
    handleSelect: (value: number, reactionTimeMs?: number) => void;
    isBreakVisible: boolean;
    breakCountdown: number;
    skipBreak: () => void;
    isInstructionVisible: boolean;
    instructionCountdown: number;
    feedbackType: 'correct' | 'incorrect' | 'neutral' | null;
    showFeedback: boolean;
    lastReactionTimeMs: number | null;
    showReactionTime: boolean;
    isModulePromptVisible: boolean;
    nextModule: string | null;
    continueToNextModule: () => void;
    finishAssessmentEarly: () => void;
    retry: () => void;
}

/**
 * Custom hook for assessment flow logic using TanStack Query.
 */
export const useAssessment = (): UseAssessmentReturn => {
    // 1. Store State (UI)
    const {
        currentIndex,
        responses,
        setAnswer,
        nextQuestion,
        isFinished,
        sessionId,
        setSessionId,
        selectedModules,
        startModule,
        finishAssessment
    } = useAssessmentStore();

    // 2. Queries (Data)
    const {
        data: questions = [],
        isLoading: isQuestionsLoading,
        refetch: refetchQuestions
    } = useAssessmentQuestions({
        modules: selectedModules,
        startModule,
        perCategory: 10,
    });

    // 3. Mutations
    const startSessionMutation = useStartSession();
    const submitAnswerMutation = useSubmitAnswer();

    const questionStartRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const feedbackTimeoutRef = useRef<number | null>(null);
    const reactionTimeTimeoutRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const answeredRef = useRef(false);
    const previousModuleRef = useRef<string | null>(null);
    const breakIntervalRef = useRef<number | null>(null);
    const instructionIntervalRef = useRef<number | null>(null);

    const [isBreakVisible, setIsBreakVisible] = useState(false);
    const [breakCountdown, setBreakCountdown] = useState(0);
    const [isInstructionVisible, setIsInstructionVisible] = useState(false);
    const [instructionCountdown, setInstructionCountdown] = useState(0);
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'neutral' | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [lastReactionTimeMs, setLastReactionTimeMs] = useState<number | null>(null);
    const [showReactionTime, setShowReactionTime] = useState(false);
    const [isModulePromptVisible, setIsModulePromptVisible] = useState(false);
    const [nextModule, setNextModule] = useState<string | null>(null);

    // Initialize session if needed
    useEffect(() => {
        if (!sessionId && !startSessionMutation.isPending && !startSessionMutation.isSuccess) {
            startSessionMutation.mutate(undefined, {
                onSuccess: (data) => {
                    setSessionId(data.id);
                },
                onError: (error) => {
                    console.error("Failed to start session:", error);
                }
            });
        }
    }, [sessionId, startSessionMutation.isPending, startSessionMutation.isSuccess, setSessionId]);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;

    const moduleQuestionIndexes = useMemo(() => {
        const indexesByModule: Record<string, number[]> = {};
        questions.forEach((q, idx) => {
            if (!indexesByModule[q.module]) {
                indexesByModule[q.module] = [];
            }
            indexesByModule[q.module].push(idx);
        });
        return indexesByModule;
    }, [questions]);

    const currentModuleIndexes = currentQuestion ? moduleQuestionIndexes[currentQuestion.module] || [] : [];
    const moduleTotal = currentModuleIndexes.length || 0;
    const moduleIndex = currentModuleIndexes.findIndex((idx) => idx === currentIndex);
    const moduleProgress = moduleTotal > 0 && moduleIndex >= 0 ? (moduleIndex + 1) / moduleTotal : 0;
    const nextQuestionInList = questions[currentIndex + 1];
    const nextModuleName = nextQuestionInList?.module ?? null;
    const isLastQuestion = currentIndex >= totalQuestions - 1;
    const isLastInModule = moduleTotal > 0 && moduleIndex === moduleTotal - 1;

    const moduleChanged = Boolean(
        currentQuestion && currentQuestion.module && currentQuestion.module !== previousModuleRef.current
    );
    const clearBreakInterval = (): void => {
        if (breakIntervalRef.current) {
            window.clearInterval(breakIntervalRef.current);
            breakIntervalRef.current = null;
        }
    };

    const clearInstructionInterval = (): void => {
        if (instructionIntervalRef.current) {
            window.clearInterval(instructionIntervalRef.current);
            instructionIntervalRef.current = null;
        }
    };

    const startInstruction = (): void => {
        clearInstructionInterval();
        setIsInstructionVisible(true);
        setInstructionCountdown(5);

        let remaining = 5;
        instructionIntervalRef.current = window.setInterval(() => {
            remaining -= 1;
            setInstructionCountdown(Math.max(remaining, 0));
            if (remaining <= 0) {
                clearInstructionInterval();
                setIsInstructionVisible(false);
            }
        }, 1000);
    };

    const skipBreak = (): void => {
        if (!currentQuestion?.module) {
            return;
        }
        clearBreakInterval();
        setIsBreakVisible(false);
        setBreakCountdown(0);
        startInstruction();
    };


    const clearQuestionTimeout = (): void => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const clearFeedbackTimeout = (): void => {
        if (feedbackTimeoutRef.current) {
            window.clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = null;
        }
    };

    const clearReactionTimeTimeout = (): void => {
        if (reactionTimeTimeoutRef.current) {
            window.clearTimeout(reactionTimeTimeoutRef.current);
            reactionTimeTimeoutRef.current = null;
        }
    };

    const playTone = (frequency: number, durationMs = 120): void => {
        try {
            const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextCtor) {
                return;
            }
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContextCtor();
            }
            const context = audioContextRef.current;
            if (!context) return;

            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.value = 0.08;

            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + durationMs / 1000);
        } catch {
            // Ignore audio errors (autoplay restrictions)
        }
    };

    const handleSelect = useCallback((value: number, reactionTimeMs?: number): void => {
        if (currentQuestion && sessionId) {
            if (answeredRef.current) {
                return;
            }
            answeredRef.current = true;
            clearQuestionTimeout();
            clearFeedbackTimeout();
            clearReactionTimeTimeout();

            const reactionTime =
                reactionTimeMs ?? (questionStartRef.current ? Date.now() - questionStartRef.current : undefined);

            if (reactionTime !== undefined) {
                setLastReactionTimeMs(reactionTime);
                setShowReactionTime(true);
                reactionTimeTimeoutRef.current = window.setTimeout(() => {
                    setShowReactionTime(false);
                }, 1500);
            }

            let isCorrect: boolean | null = null;
            if (currentQuestion.module === 'COGNITIVE') {
                isCorrect = value === 1;
            } else {
                isCorrect = true;
            }

            setFeedbackType(isCorrect ? 'correct' : 'incorrect');
            setShowFeedback(true);
            feedbackTimeoutRef.current = window.setTimeout(() => {
                setShowFeedback(false);
            }, 250);

            if (isGoNoGoQuestion(currentQuestion)) {
                const isNoGo = isNoGoStimulus(currentQuestion);
                playTone(isNoGo ? 220 : 520);
            }

            // Optimistic update in UI
            setAnswer(currentQuestion.id, value);

            // Sync with backend
            submitAnswerMutation.mutate({
                sessionId,
                questionId: currentQuestion.id,
                value,
                reactionTimeMs: reactionTime,
            });

            if (isLastInModule && !isLastQuestion && nextModuleName) {
                setNextModule(nextModuleName);
                setIsModulePromptVisible(true);
                return;
            }

            // Auto advance
            setTimeout(() => {
                nextQuestion(totalQuestions);
            }, 300);
        }
    }, [
        currentQuestion,
        sessionId,
        setAnswer,
        submitAnswerMutation,
        nextQuestion,
        totalQuestions,
        isLastInModule,
        isLastQuestion,
        nextModuleName
    ]);

    const continueToNextModule = useCallback(() => {
        setIsModulePromptVisible(false);
        setNextModule(null);
        nextQuestion(totalQuestions);
    }, [nextQuestion, totalQuestions]);

    const finishAssessmentEarly = useCallback(() => {
        setIsModulePromptVisible(false);
        setNextModule(null);
        finishAssessment();
    }, [finishAssessment]);

    useEffect(() => {
        if (!currentQuestion || !currentQuestion.module) {
            return;
        }

        const currentModule = currentQuestion.module;
        if (currentModule && currentModule !== previousModuleRef.current) {
            previousModuleRef.current = currentModule;
            clearBreakInterval();
            clearInstructionInterval();
            setIsInstructionVisible(false);

            setIsBreakVisible(true);
            setBreakCountdown(3);
            let remaining = 3;
            breakIntervalRef.current = window.setInterval(() => {
                remaining -= 1;
                setBreakCountdown(Math.max(remaining, 0));
                if (remaining <= 0) {
                    clearBreakInterval();
                    setIsBreakVisible(false);
                    startInstruction();
                }
            }, 1000);
        }

        return () => {
            clearBreakInterval();
            clearInstructionInterval();
        };
    }, [currentQuestion]);

    useEffect(() => {
        if (!currentQuestion || !sessionId || isInstructionVisible || isBreakVisible || moduleChanged) {
            return;
        }

        answeredRef.current = false;
        questionStartRef.current = Date.now();
        clearQuestionTimeout();

        const timeLimitMs = getCognitiveTimeLimitMs(currentQuestion);
        if (timeLimitMs) {
            timeoutRef.current = window.setTimeout(() => {
                if (answeredRef.current) {
                    return;
                }

                let timeoutValue = 0;
                if (isGoNoGoQuestion(currentQuestion)) {
                    timeoutValue = isNoGoStimulus(currentQuestion) ? 1 : 0;
                }

                handleSelect(timeoutValue, timeLimitMs);
            }, timeLimitMs);
        }

        return clearQuestionTimeout;
    }, [currentQuestion, sessionId, handleSelect, isInstructionVisible, isBreakVisible, moduleChanged]);

    // Derived loading state
    const isLoading = isQuestionsLoading || (sessionId === null && startSessionMutation.isPending);

    return {
        isLoading,
        isFinished,
        currentQuestion: currentQuestion as Question | undefined,
        currentIndex,
        totalQuestions,
        responses,
        progress,
        moduleProgress,
        moduleIndex: moduleIndex < 0 ? 0 : moduleIndex,
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
        retry: refetchQuestions
    };
};
