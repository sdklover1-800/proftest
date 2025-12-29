import { useEffect } from 'react';
import { useAssessmentStore } from '@/store/assessmentStore';

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
 * Custom hook for assessment flow logic.
 * Manages session initialization, question fetching, and answer handling.
 */
export const useAssessment = (): UseAssessmentReturn => {
    const {
        questions,
        currentIndex,
        responses,
        fetchQuestions,
        initSession,
        setAnswer,
        nextQuestion,
        isLoading,
        isFinished,
        sessionId
    } = useAssessmentStore();

    useEffect(() => {
        // Init session if not exists
        if (!sessionId) {
            initSession();
        }
        // Fetch questions if empty
        if (questions.length === 0) {
            fetchQuestions();
        }
        console.log('Current questions in store:', questions);
    }, [fetchQuestions, initSession, sessionId, questions, questions.length]);

    const currentQuestion = questions[currentIndex];
    const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

    const handleSelect = (value: number): void => {
        if (currentQuestion) {
            setAnswer(currentQuestion.id, value);

            // Auto advance after short delay for UX
            setTimeout(() => {
                nextQuestion();
            }, 300);
        }
    };

    return {
        isLoading,
        isFinished,
        currentQuestion,
        currentIndex,
        totalQuestions: questions.length,
        responses,
        progress,
        handleSelect,
        retry: fetchQuestions
    };
};
