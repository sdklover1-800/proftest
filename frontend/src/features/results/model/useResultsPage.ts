import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { assessmentApi } from '@/api/assessmentApi';
import { useAssessmentStore } from '@/store/assessmentStore';

interface ChartData {
    subject: string;
    A: number;
    fullMark: number;
}

interface ResultsData {
    RIASEC: ChartData[];
    BIG5: ChartData[];
}

interface UseResultsPageReturn {
    results: ResultsData | null;
    recommendations: any[];
    loading: boolean;
    error: string | null;
    activeTab: 'RIASEC' | 'BIG5';
    setActiveTab: (tab: 'RIASEC' | 'BIG5') => void;
    sessionId: number | null;
}

/**
 * Hook containing ALL logic for the Results page.
 * Handles session ID resolution, data fetching, and tab state.
 */
export const useResultsPage = (): UseResultsPageReturn => {
    const location = useLocation();
    const storeSessionId = useAssessmentStore((state) => state.sessionId);

    // Resolve session ID from URL, localStorage, or store
    const resolveSessionId = (): number | null => {
        // 1. Check URL params
        const params = new URLSearchParams(location.search);
        const urlSessionId = params.get('session');
        if (urlSessionId) return parseInt(urlSessionId, 10);

        // 2. Check localStorage (for history viewing)
        const viewSessionId = localStorage.getItem('viewSessionId');
        if (viewSessionId) {
            localStorage.removeItem('viewSessionId');
            return parseInt(viewSessionId, 10);
        }

        // 3. Fall back to store
        return storeSessionId;
    };

    const [sessionId] = useState<number | null>(resolveSessionId);
    const [results, setResults] = useState<ResultsData | null>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'RIASEC' | 'BIG5'>('RIASEC');

    useEffect(() => {
        const fetchResults = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // Try to get existing results first
                try {
                    const response = await assessmentApi.getResults(sessionId);
                    setResults(formatData(response.scores));
                    setRecommendations(response.recommendations || []);
                } catch {
                    // If not found, try to finish the assessment
                    const response = await assessmentApi.finishAssessment(sessionId);
                    setResults(formatData(response.scores));
                    setRecommendations(response.recommendations || []);
                }
            } catch (err) {
                console.error("Failed to fetch results", err);
                setError("Could not load results. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [sessionId]);

    return { results, recommendations, loading, error, activeTab, setActiveTab, sessionId };
};

/**
 * Format raw API scores into chart-friendly data.
 */
const formatData = (apiData: any): ResultsData => {
    const formatSection = (sectionData: Record<string, number>): ChartData[] => {
        return Object.entries(sectionData).map(([key, value]) => ({
            subject: key,
            A: value,
            fullMark: 30
        }));
    };

    return {
        RIASEC: apiData.RIASEC ? formatSection(apiData.RIASEC) : [],
        BIG5: apiData.BIG5 ? formatSection(apiData.BIG5) : []
    };
};
