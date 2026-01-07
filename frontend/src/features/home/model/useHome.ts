import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { assessmentApi } from '@/api/assessmentApi';

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
    handleStartAssessment: () => void;
    viewSessionResults: (sessionId: number) => void;
}

/**
 * Hook containing all logic for the Home page.
 */
export const useHome = (): UseHomeReturn => {
    const history = useHistory();
    const user = useAuthStore((state) => state.user);

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

    const handleStartAssessment = (): void => {
        // Navigate to context setup page first
        history.push('/assessment/context');
    };

    const viewSessionResults = (sessionId: number): void => {
        localStorage.setItem('viewSessionId', sessionId.toString());
        history.push('/results');
    };

    const userName = user?.email.split('@')[0] || 'User';

    return {
        userName,
        sessions,
        loading,
        starting: false, // No longer needed, context page handles this
        handleRefresh,
        handleStartAssessment,
        viewSessionResults
    };
};
