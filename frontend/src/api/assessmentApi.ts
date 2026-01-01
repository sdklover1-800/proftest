import client from './client';
import type { Question } from '../store/assessmentStore';

export const assessmentApi = {
    getQuestions: async (): Promise<Question[]> => {
        const response = await client.get<Question[]>('/api/v1/assessment/questions');
        return response.data;
    },

    startSession: async (): Promise<{ id: number; start_time: string }> => {
        const response = await client.post('/api/v1/assessment/start', {
            // user_id: 1, // Optional: if we implemented auth
        });
        return response.data;
    },

    submitAnswer: async (sessionId: number, questionId: number, value: number, reactionTimeMs?: number) => {
        const response = await client.post('/api/v1/assessment/submit', {
            session_id: sessionId,
            question_id: questionId,
            value: value,
            reaction_time_ms: reactionTimeMs
        });
        return response.data;
    },

    finishAssessment: async (sessionId: number): Promise<any> => {
        const response = await client.post(`/api/v1/assessment/${sessionId}/finish`);
        return response.data;
    },

    getResults: async (sessionId: number): Promise<any> => {
        const response = await client.get(`/api/v1/assessment/${sessionId}/results`);
        return response.data;
    },

    getHistory: async (): Promise<any[]> => {
        const response = await client.get('/api/v1/assessment/history');
        return response.data;
    }
};
