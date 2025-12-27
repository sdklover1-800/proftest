import { useEffect } from 'react';
import { useAssessmentStore } from '../store/assessmentStore';

export const useAssessmentPage = () => {
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
    }, [fetchQuestions, initSession, sessionId, questions.length]);

    const currentQuestion = questions[currentIndex];
    const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

    const handleSelect = (value: number) => {
        if (currentQuestion) {
            setAnswer(currentQuestion.id, value);

            // Auto advance
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
        items: questions, // Exposing full list if needed, or just length
        responses,
        progress,
        handleSelect,
        retry: fetchQuestions
    };
};
