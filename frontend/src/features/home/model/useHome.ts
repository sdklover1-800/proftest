import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssessmentStore } from '@/store/assessmentStore';
import { assessmentApi } from '@/api/assessmentApi';
import { useStartSession } from '@/features/assessment/api/queries';

export interface SessionSummary {
    id: number;
    date: string;
    status: string;
    top_result: string | null;
}

interface UseHomeReturn {
    userName: string;
    sessions: SessionSummary[];
    loading: boolean;
    starting: boolean;
    handleRefresh: (event: any) => Promise<void>;
    handleStartAssessment: () => Promise<void>;
    viewSessionResults: (sessionId: number) => void;
}

/**
 * Hook containing all logic for the Home page.
 */
export const useHome = (): UseHomeReturn => {
    const history = useHistory();
    const user = useAuthStore((state) => state.user);
    const setSessionId = useAssessmentStore((state) => state.setSessionId);

    // React Query Mutation
    const startSessionMutation = useStartSession();

    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const historyData = await assessmentApi.getHistory();
            setSessions(historyData);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleRefresh = async (event: any): Promise<void> => {
        await fetchHistory();
        if (event.detail?.complete) {
            event.detail.complete();
        }
    };

    const handleStartAssessment = async (): Promise<void> => {
        startSessionMutation.mutate(undefined, {
            onSuccess: (data) => {
                setSessionId(data.id);
                history.push('/assessment');
            },
            onError: (error) => {
                console.error("Failed to start assessment", error);
            }
        });
    };

    const viewSessionResults = (sessionId: number): void => {
        localStorage.setItem('viewSessionId', sessionId.toString());
        history.push('/results');
    };

    const userName = user?.email.split('@')[0] || 'User';
    // const completedSessions = sessions.filter(s => s.status === 'completed');

    return {
        userName,
        sessions,
        loading,
        starting: startSessionMutation.isPending,
        handleRefresh,
        handleStartAssessment,
        viewSessionResults
    };
};
