import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentApi } from '@/api/assessmentApi';
import type { QuestionQueryParams } from '@/api/assessmentApi';
import type { ContextData } from '@/api/assessmentApi';

export const ASSESSMENT_KEYS = {
    all: ['assessment'] as const,
    questions: (params?: QuestionQueryParams) => [
        ...ASSESSMENT_KEYS.all,
        'questions',
        params?.modules?.join(',') ?? 'all',
        params?.startModule ?? 'none',
        params?.perModule ?? 'default',
        params?.perCategory ?? 'default',
    ] as const,
    session: (id: number) => [...ASSESSMENT_KEYS.all, 'session', id] as const,
};

export const useAssessmentQuestions = (params?: QuestionQueryParams) => {
    return useQuery({
        queryKey: ASSESSMENT_KEYS.questions(params),
        queryFn: () => assessmentApi.getQuestions(params),
        staleTime: Infinity, // Questions generally don't change during a session
        refetchOnMount: 'always',
    });
};

export const useStartSession = () => {
    return useMutation({
        mutationFn: (contextData?: ContextData) => assessmentApi.startSession(contextData),
    });
};

export const useSubmitAnswer = () => {
    return useMutation({
        mutationFn: ({
            sessionId,
            questionId,
            value,
            reactionTimeMs,
            timedOut,
        }: {
            sessionId: number;
            questionId: number;
            value: number;
            reactionTimeMs?: number;
            timedOut?: boolean;
        }) => assessmentApi.submitAnswer(sessionId, questionId, value, reactionTimeMs, timedOut),
    });
};
