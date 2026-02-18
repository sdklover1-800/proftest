import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { assessmentApi } from '@/api/assessmentApi';
import type {
    DashboardActionContent,
    DashboardAnalysisContent,
    DashboardBlock,
    DashboardInsightsContent,
    DashboardMetricsContent,
    DashboardProgressContent,
    DashboardRadarContent,
    DashboardRecommendationsContent,
    DashboardSkillsContent,
    DashboardSummaryContent,
    ProfileDashboard,
} from '@/types/assessment';

interface UseProfileDashboardReturn {
    dashboard: ProfileDashboard | null;
    sessionId: number | null;
    loading: boolean;
    error: string | null;
    verdictBlock: DashboardBlock | undefined;
    analysisBlock: DashboardBlock | undefined;
    radarBlock: DashboardBlock | undefined;
    skillsBlock: DashboardBlock | undefined;
    metricsBlock: DashboardBlock | undefined;
    insightsBlock: DashboardBlock | undefined;
    recommendationsBlock: DashboardBlock | undefined;
    progressBlock: DashboardBlock | undefined;
    actionBlock: DashboardBlock | undefined;
    getSummaryContent: (block?: DashboardBlock) => DashboardSummaryContent | null;
    getAnalysisContent: (block?: DashboardBlock) => DashboardAnalysisContent | null;
    getRadarContent: (block?: DashboardBlock) => DashboardRadarContent | null;
    getSkillsContent: (block?: DashboardBlock) => DashboardSkillsContent | null;
    getMetricsContent: (block?: DashboardBlock) => DashboardMetricsContent | null;
    getInsightsContent: (block?: DashboardBlock) => DashboardInsightsContent | null;
    getRecommendationsContent: (block?: DashboardBlock) => DashboardRecommendationsContent | null;
    getProgressContent: (block?: DashboardBlock) => DashboardProgressContent | null;
    getActionContent: (block?: DashboardBlock) => DashboardActionContent | null;
}

const isSummaryContent = (value: unknown): value is DashboardSummaryContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return typeof record.headline === 'string' && Array.isArray(record.bullets);
};

const isAnalysisContent = (value: unknown): value is DashboardAnalysisContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.strengths) && Array.isArray(record.weaknesses);
};

const isRadarContent = (value: unknown): value is DashboardRadarContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.axes) && typeof record.ai_note === 'string';
};

const isSkillsContent = (value: unknown): value is DashboardSkillsContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.items);
};

const isMetricsContent = (value: unknown): value is DashboardMetricsContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.items);
};

const isInsightsContent = (value: unknown): value is DashboardInsightsContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.items);
};

const isRecommendationsContent = (value: unknown): value is DashboardRecommendationsContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.buckets);
};

const isProgressContent = (value: unknown): value is DashboardProgressContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.items) && typeof record.ai_note === 'string';
};

const isActionContent = (value: unknown): value is DashboardActionContent => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return typeof record.headline === 'string' && typeof record.description === 'string';
};

export const useProfileDashboard = (enabled: boolean = true): UseProfileDashboardReturn => {
    const { i18n } = useTranslation();
    const [dashboard, setDashboard] = useState<ProfileDashboard | null>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;

        const fetchDashboard = async (): Promise<void> => {
            try {
                setLoading(true);
                setError(null);
                const response = await assessmentApi.getProfileDashboard(i18n.language);
                if (cancelled) return;
                setDashboard(response.dashboard);
                setSessionId(response.session_id);
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to fetch profile dashboard', err);
                setError('Could not load profile dashboard.');
                setDashboard(null);
                setSessionId(null);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDashboard();

        return () => {
            cancelled = true;
        };
    }, [i18n.language, enabled]);

    const blocks = useMemo(() => dashboard?.blocks ?? [], [dashboard?.blocks]);

    const findBlock = (blockId: string): DashboardBlock | undefined =>
        blocks.find((block) => block.block_id === blockId);

    const verdictBlock = findBlock('verdict');
    const analysisBlock = findBlock('analysis');
    const radarBlock = findBlock('radar');
    const skillsBlock = findBlock('skills');
    const metricsBlock = findBlock('metrics');
    const insightsBlock = findBlock('insights');
    const recommendationsBlock = findBlock('recommendations');
    const progressBlock = findBlock('progress');
    const actionBlock = findBlock('action');

    const getSummaryContent = (block?: DashboardBlock): DashboardSummaryContent | null =>
        block && isSummaryContent(block.content) ? block.content : null;
    const getAnalysisContent = (block?: DashboardBlock): DashboardAnalysisContent | null =>
        block && isAnalysisContent(block.content) ? block.content : null;
    const getRadarContent = (block?: DashboardBlock): DashboardRadarContent | null =>
        block && isRadarContent(block.content) ? block.content : null;
    const getSkillsContent = (block?: DashboardBlock): DashboardSkillsContent | null =>
        block && isSkillsContent(block.content) ? block.content : null;
    const getMetricsContent = (block?: DashboardBlock): DashboardMetricsContent | null =>
        block && isMetricsContent(block.content) ? block.content : null;
    const getInsightsContent = (block?: DashboardBlock): DashboardInsightsContent | null =>
        block && isInsightsContent(block.content) ? block.content : null;
    const getRecommendationsContent = (block?: DashboardBlock): DashboardRecommendationsContent | null =>
        block && isRecommendationsContent(block.content) ? block.content : null;
    const getProgressContent = (block?: DashboardBlock): DashboardProgressContent | null =>
        block && isProgressContent(block.content) ? block.content : null;
    const getActionContent = (block?: DashboardBlock): DashboardActionContent | null =>
        block && isActionContent(block.content) ? block.content : null;

    return {
        dashboard,
        sessionId,
        loading,
        error,
        verdictBlock,
        analysisBlock,
        radarBlock,
        skillsBlock,
        metricsBlock,
        insightsBlock,
        recommendationsBlock,
        progressBlock,
        actionBlock,
        getSummaryContent,
        getAnalysisContent,
        getRadarContent,
        getSkillsContent,
        getMetricsContent,
        getInsightsContent,
        getRecommendationsContent,
        getProgressContent,
        getActionContent,
    };
};
