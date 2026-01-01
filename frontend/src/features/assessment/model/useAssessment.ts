import { useEffect } from 'react';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useAssessmentQuestions, useStartSession, useSubmitAnswer } from '../api/queries';

interface Question {
    id: number;
    code: string;
    module: string;
    type: string;
    text_ru: string;
    text_kz?: string;
    text_en?: string;
}

interface UseAssessmentReturn {
    isLoading: boolean;
    isFinished: boolean;
    currentQuestion: Question | undefined;
    currentIndex: number;
    totalQuestions: number;
    responses: Record<number, number>;
    progress: number;
    handleSelect: (value: number) => void;
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
        setSessionId
    } = useAssessmentStore();

    // 2. Queries (Data)
    const {
        data: questions = [],
        isLoading: isQuestionsLoading,
        refetch: refetchQuestions
    } = useAssessmentQuestions();

    // 3. Mutations
    const startSessionMutation = useStartSession();
    const submitAnswerMutation = useSubmitAnswer();

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

    const handleSelect = (value: number): void => {
        if (currentQuestion && sessionId) {
            // Optimistic update in UI
            setAnswer(currentQuestion.id, value);

            // Sync with backend
            submitAnswerMutation.mutate({
                sessionId,
                questionId: currentQuestion.id,
                value
            });

            // Auto advance
            setTimeout(() => {
                nextQuestion(totalQuestions);
            }, 300);
        }
    };

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
        handleSelect,
        retry: refetchQuestions
    };
};
