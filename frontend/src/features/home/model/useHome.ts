import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssessmentStore } from '@/store/assessmentStore';
import { client } from '@/api/client';

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
    const { startAssessment } = useAssessmentStore();

    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    const fetchHistory = async (): Promise<void> => {
        try {
            const response = await client.get('/api/v1/assessment/history');
            setSessions(response.data);
        } catch (error) {
            console.error('Failed to fetch history', error);
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
        setStarting(true);
        try {
            await startAssessment();
            history.push('/assessment');
        } catch (error) {
            console.error('Failed to start assessment:', error);
        } finally {
            setStarting(false);
        }
    };

    const viewSessionResults = (sessionId: number): void => {
        localStorage.setItem('viewSessionId', sessionId.toString());
        history.push('/results');
    };

    const userName = user?.email.split('@')[0] || 'User';
    const completedSessions = sessions.filter(s => s.status === 'completed');

    return {
        userName,
        sessions: completedSessions,
        loading,
        starting,
        handleRefresh,
        handleStartAssessment,
        viewSessionResults
    };
};
