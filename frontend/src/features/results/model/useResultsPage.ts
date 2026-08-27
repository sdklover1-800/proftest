import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { assessmentApi } from '@/api/assessmentApi';
import { useAssessmentStore } from '@/store/assessmentStore';
import type { AIInsights } from '@/types/assessment';

/** A line of work the profile points at, as the API scores it. */
export interface CareerMatch {
    career_id: string;
    title: string;
    summary: string;
    /** 0..100. */
    match: number;
    evidence: { label: string; value: number; supports: boolean }[];
}

/** One score placed against its reference distribution. */
export interface ScaleNorm {
    raw: number;
    percentile: number;
    median: number;
    /** "provisional" until norms are measured on this app's own users. */
    source: 'provisional' | 'sample' | 'none';
}

export type ProfileNorms = Record<string, Record<string, ScaleNorm>>;

interface ChartData {
    subject: string;
    A: number;
    fullMark: number;
}

export interface ContextData {
    sleep: number;
    stress: 'low' | 'medium' | 'high';
    mood: 'sad' | 'neutral' | 'happy';
}

interface ResultsData {
    RIASEC: ChartData[];
    BIG5: ChartData[];
    SJT?: Record<string, number>;
    COGNITIVE?: {
        total_score?: number;
        details?: Record<string, number>;
    };
    contextData?: ContextData | null; // Added contextData
}

export interface SessionSummary {
    id: number;
    date: string;
    status: string;
    top_result: string | null;
}

interface UseResultsPageReturn {
    results: ResultsData | null;
    recommendations: any[];
    aiInsights: AIInsights | null;
    loading: boolean;
    error: string | null;
    activeTab: 'RIASEC' | 'BIG5';
    setActiveTab: (tab: 'RIASEC' | 'BIG5') => void;
    sessionId: number | null;
    history: SessionSummary[];
    historyLoading: boolean;
    careers: CareerMatch[];
    norms: ProfileNorms;
}

/**
 * Hook containing ALL logic for the Results page.
 * Handles session ID resolution, data fetching, and tab state.
 */
export const useResultsPage = (): UseResultsPageReturn => {
    const location = useLocation();
    const storeSessionId = useAssessmentStore((state) => state.sessionId);
    const { i18n } = useTranslation();

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
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'RIASEC' | 'BIG5'>('RIASEC');
    const [careers, setCareers] = useState<CareerMatch[]>([]);
    const [norms, setNorms] = useState<ProfileNorms>({});
    const [history, setHistory] = useState<SessionSummary[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // Try to get existing results first
                try {
                    const response = await assessmentApi.getResults(sessionId, i18n.language);
                    setResults(formatData(response.scores, response.context_data));
                    setRecommendations(response.recommendations || []);
                    setAiInsights(response.ai_insights || null);
                    setCareers(response.careers || []);
                    setNorms(response.norms || {});
                } catch {
                    // If not found, try to finish the assessment
                    const response = await assessmentApi.finishAssessment(sessionId, i18n.language);
                    setResults(formatData(response.scores, response.context_data));
                    setRecommendations(response.recommendations || []);
                    setAiInsights(response.ai_insights || null);
                    setCareers(response.careers || []);
                    setNorms(response.norms || {});
                }
            } catch (err) {
                console.error("Failed to fetch results", err);
                setError("Could not load results. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [sessionId, i18n.language]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setHistoryLoading(true);
                const historyData = await assessmentApi.getHistory();
                setHistory(historyData || []);
            } catch (err) {
                console.error('Failed to fetch history', err);
                setHistory([]);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return {
        results, recommendations, aiInsights, loading, error, activeTab, setActiveTab,
        sessionId, history, historyLoading, careers, norms,
    };
};

/**
 * Format raw API scores into chart-friendly data.
 */
const formatData = (apiData: any, contextData?: any): ResultsData => {
    const formatSection = (sectionData: Record<string, number>): ChartData[] => {
        return Object.entries(sectionData).map(([key, value]) => ({
            subject: key,
            A: value,
            fullMark: 100
        }));
    };

    return {
        RIASEC: apiData.RIASEC ? formatSection(apiData.RIASEC) : [],
        BIG5: apiData.BIG5 ? formatSection(apiData.BIG5) : [],
        SJT: apiData.SJT || undefined,
        COGNITIVE: apiData.COGNITIVE || undefined,
        contextData: contextData || null
    };
};
