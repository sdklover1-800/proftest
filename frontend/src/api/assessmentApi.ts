import client from './client';
import type { AssessmentModule, Question } from '../store/assessmentStore';
import type {
    PlanTaskStatus,
    ProfileDashboard,
    ProfileDashboardResponse,
    WeeklyPlan,
} from '@/types/assessment';

export interface ContextData {
    sleep: number;
    stress: 'low' | 'medium' | 'high';
    mood: 'sad' | 'neutral' | 'happy';
    age?: number;
}

export interface QuestionQueryParams {
    modules?: AssessmentModule[];
    startModule?: AssessmentModule;
    perModule?: number;
    // Deprecated: use perModule
    perCategory?: number;
}

export interface PlanCreatePayload {
    run_id: number;
    title?: string;
    goal?: string;
    selected_rec_ids?: string[];
}

export interface UpdateTaskStatusPayload {
    task_id: string;
    status: PlanTaskStatus;
}

export const assessmentApi = {
    getQuestions: async (params?: QuestionQueryParams): Promise<Question[]> => {
        const response = await client.get<Question[]>('/api/v1/assessment/questions', {
            params: {
                modules: params?.modules?.join(','),
                start_module: params?.startModule,
                per_module: params?.perModule ?? params?.perCategory,
            },
        });
        return response.data;
    },

    startSession: async (contextData?: ContextData): Promise<{ id: number; start_time: string }> => {
        const response = await client.post('/api/v1/assessment/start', {
            context_data: contextData || null,
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

    finishAssessment: async (sessionId: number, lang?: string): Promise<any> => {
        const response = await client.post(
            `/api/v1/assessment/${sessionId}/finish`,
            null,
            {
                params: {
                    lang,
                },
            }
        );
        return response.data;
    },

    getResults: async (sessionId: number, lang?: string): Promise<any> => {
        const response = await client.get(`/api/v1/assessment/${sessionId}/results`, {
            params: {
                lang,
            },
        });
        return response.data;
    },

    getAssessmentBlocks: async (sessionId: number, lang?: string): Promise<ProfileDashboard> => {
        const response = await client.get<ProfileDashboard>(`/api/v1/assessment/${sessionId}/blocks`, {
            params: {
                lang,
            },
        });
        return response.data;
    },

    getProfileDashboard: async (lang?: string): Promise<ProfileDashboardResponse> => {
        const response = await client.get<ProfileDashboardResponse>('/api/v1/profile/dashboard', {
            params: {
                lang,
            },
        });
        return response.data;
    },

    createPlan: async (payload: PlanCreatePayload): Promise<WeeklyPlan> => {
        const response = await client.post<WeeklyPlan>('/api/v1/plans', payload);
        return response.data;
    },

    getActivePlan: async (): Promise<WeeklyPlan> => {
        const response = await client.get<WeeklyPlan>('/api/v1/plans/active');
        return response.data;
    },

    getPlan: async (planId: string): Promise<WeeklyPlan> => {
        const response = await client.get<WeeklyPlan>(`/api/v1/plans/${planId}`);
        return response.data;
    },

    updatePlanTaskStatus: async (planId: string, payload: UpdateTaskStatusPayload): Promise<any> => {
        const response = await client.post(`/api/v1/plans/${planId}/task-status`, payload);
        return response.data;
    },

    getPlanProgress: async (planId: string): Promise<any> => {
        const response = await client.get(`/api/v1/plans/${planId}/progress`);
        return response.data;
    },

    getEvidenceByIds: async (ids: string[]): Promise<any[]> => {
        const response = await client.get('/api/v1/evidence', {
            params: {
                ids: ids.join(','),
            },
        });
        return response.data;
    },

    getEvidenceById: async (evidenceId: string): Promise<any> => {
        const response = await client.get(`/api/v1/evidence/${evidenceId}`);
        return response.data;
    },

    getAssessmentDelta: async (runId: number, prevRunId?: number): Promise<any> => {
        const response = await client.get(`/api/v1/assessments/${runId}/delta`, {
            params: {
                prev_run_id: prevRunId,
            },
        });
        return response.data;
    },

    getRfcTemplate: async (): Promise<any> => {
        const response = await client.get('/api/v1/plans/templates/rfc');
        return response.data;
    },

    getTaskCatalog: async (): Promise<any> => {
        const response = await client.get('/api/v1/plans/tasks/catalog');
        return response.data;
    },

    getRuleVersions: async (): Promise<any> => {
        const response = await client.get('/api/v1/rules/version');
        return response.data;
    },

    getHistory: async (): Promise<any[]> => {
        const response = await client.get('/api/v1/assessment/history');
        return response.data;
    }
};
