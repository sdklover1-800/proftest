import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentApi } from '@/api/assessmentApi';

export const ASSESSMENT_KEYS = {
    all: ['assessment'] as const,
    questions: () => [...ASSESSMENT_KEYS.all, 'questions'] as const,
    session: (id: number) => [...ASSESSMENT_KEYS.all, 'session', id] as const,
};

export const useAssessmentQuestions = () => {
    return useQuery({
        queryKey: ASSESSMENT_KEYS.questions(),
        queryFn: assessmentApi.getQuestions,
        staleTime: Infinity, // Questions generally don't change during a session
    });
};

export const useStartSession = () => {
    return useMutation({
        mutationFn: assessmentApi.startSession,
    });
};

export const useSubmitAnswer = () => {
    return useMutation({
        mutationFn: ({ sessionId, questionId, value }: { sessionId: number; questionId: number; value: number }) =>
            assessmentApi.submitAnswer(sessionId, questionId, value),
    });
};
