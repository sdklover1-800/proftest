import React, { useEffect, useMemo, useState } from 'react';
import {
    IonPage,
    IonContent,
    IonButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useProfile } from '../model/useProfile';
import { useProfileDashboard } from '../model/useProfileDashboard';
import ProfileSettings from './ProfileSettings';
import PsychometricRadar from '@/shared/ui/PsychometricRadar';
import AILoadingOverlay from '@/shared/ui/AILoadingOverlay';
import type { DashboardCTA, DashboardMetricItem } from '@/types/assessment';
import { assessmentApi } from '@/api/assessmentApi';
import { formatPercent, toPercentNumber } from '@/shared/utils/percent';

interface EvidenceItem {
    evidence_id: string;
    source_type: string;
    snippet: string;
    confidence: number;
    tags: string[];
}

interface RadarPoint {
    id: string;
    subject: string;
    A: number;
    fullMark: number;
}

const statusTextClass = (status: string): string => {
    if (status === 'good') return 'text-emerald-600';
    if (status === 'medium') return 'text-amber-600';
    return 'text-rose-600';
};

const statusBgClass = (status: string): string => {
    if (status === 'good') return 'bg-emerald-50 border-emerald-100';
    if (status === 'medium') return 'bg-amber-50 border-amber-100';
    return 'bg-rose-50 border-rose-100';
};

const metricStatusDotClass = (status: DashboardMetricItem['status']): string => {
    if (status === 'good') return 'bg-emerald-500';
    if (status === 'medium') return 'bg-amber-500';
    return 'bg-rose-500';
};

/**
 * Profile page - renders AI dashboard + user settings.
 */
const ProfilePage: React.FC = () => {
    const { user, t, i18n, handleLogout, handleLanguageChange } = useProfile();
    const uiLang = (i18n.language || 'en').split('-')[0];
    const uiCopy = useMemo(() => {
        if (uiLang === 'ru') {
            return {
                profileAnalysisTitle: 'Анализ профиля',
                profileAnalysisHint: 'Нажмите кнопку, чтобы собрать единый анализ по всем пройденным тестам.',
                runAnalysis: 'Запустить анализ',
                readiness: 'Готовность',
                role: 'Роль',
                tests: 'Тесты',
                loadingProfile: 'Загрузка AI-анализа...',
                emptyTitle: 'AI Career Copilot',
                emptyDescription: 'Пройдите хотя бы один тест, чтобы открыть вердикт профиля, диагностику и план на 7 дней.',
                startAssessment: 'Начать тест',
                continuePlan: 'Продолжить план',
                strengths: 'Сильные стороны',
                weaknesses: 'Зоны роста',
                recommendations: 'Рекомендации',
                why: 'Почему?',
                hideWhy: 'Скрыть',
                loadingEvidence: 'Загрузка evidence...',
                noEvidence: 'Пока нет доступных evidence-фрагментов.',
                target: 'цель',
                impactEffort: 'Влияние',
                effort: 'Усилие',
                confidence: 'Уверенность',
            };
        }
        if (uiLang === 'kz') {
            return {
                profileAnalysisTitle: 'Профиль талдауы',
                profileAnalysisHint: 'Барлық өткен тесттер бойынша біріккен талдауды алу үшін түймені басыңыз.',
                runAnalysis: 'Талдауды бастау',
                readiness: 'Дайындық',
                role: 'Рөл',
                tests: 'Тесттер',
                loadingProfile: 'AI талдауы жүктелуде...',
                emptyTitle: 'AI Career Copilot',
                emptyDescription: 'Профиль қорытындысын, диагностика мен 7 күндік жоспарды ашу үшін кемінде бір тест өтіңіз.',
                startAssessment: 'Тесті бастау',
                continuePlan: 'Жоспарды жалғастыру',
                strengths: 'Күшті жақтар',
                weaknesses: 'Өсу аймақтары',
                recommendations: 'Ұсыныстар',
                why: 'Неге?',
                hideWhy: 'Жасыру',
                loadingEvidence: 'Evidence жүктелуде...',
                noEvidence: 'Evidence үзінділері әлі қолжетімді емес.',
                target: 'мақсат',
                impactEffort: 'Әсері',
                effort: 'Күші',
                confidence: 'Сенімділік',
            };
        }
        return {
            profileAnalysisTitle: 'Profile analysis',
            profileAnalysisHint: 'Press the button to build one combined analysis across all completed tests.',
            runAnalysis: 'Run analysis',
            readiness: 'Readiness',
            role: 'Role',
            tests: 'Tests',
            loadingProfile: 'Loading AI profile...',
            emptyTitle: 'AI Career Copilot',
            emptyDescription: 'Complete one assessment to unlock profile verdict, diagnostics, and a 7-day growth plan.',
            startAssessment: 'Start assessment',
            continuePlan: 'Continue plan',
            strengths: 'Strengths',
            weaknesses: 'Weaknesses',
            recommendations: 'Recommendations',
            why: 'Why?',
            hideWhy: 'Hide why',
            loadingEvidence: 'Loading evidence...',
            noEvidence: 'No evidence snippets available.',
            target: 'target',
            impactEffort: 'Impact',
            effort: 'Effort',
            confidence: 'Confidence',
        };
    }, [uiLang]);
    const [analysisRequested, setAnalysisRequested] = useState<boolean>(false);
    const {
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
    } = useProfileDashboard(analysisRequested);

    const history = useHistory();

    const initials = user?.email
        ? user.email.substring(0, 2).toUpperCase()
        : '??';
    const [expandedInsightIds, setExpandedInsightIds] = useState<Record<string, boolean>>({});
    const [insightEvidence, setInsightEvidence] = useState<Record<string, EvidenceItem[]>>({});
    const [insightEvidenceLoading, setInsightEvidenceLoading] = useState<Record<string, boolean>>({});
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [isPlanActionLoading, setIsPlanActionLoading] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        const loadActivePlan = async (): Promise<void> => {
            try {
                const activePlan = await assessmentApi.getActivePlan();
                if (!cancelled) {
                    setActivePlanId(activePlan.plan_id);
                }
            } catch (err) {
                if (!cancelled && (err as { response?: { status?: number } }).response?.status === 404) {
                    setActivePlanId(null);
                    return;
                }
                if (!cancelled) {
                    console.error('Failed to load active plan', err);
                }
            }
        };

        void loadActivePlan();
        return () => {
            cancelled = true;
        };
    }, []);

    const openOrCreatePlan = async (): Promise<void> => {
        setIsPlanActionLoading(true);
        if (activePlanId) {
            history.push(`/plan/${activePlanId}`);
            setIsPlanActionLoading(false);
            return;
        }

        try {
            const activePlan = await assessmentApi.getActivePlan();
            setActivePlanId(activePlan.plan_id);
            history.push(`/plan/${activePlan.plan_id}`);
            setIsPlanActionLoading(false);
            return;
        } catch (err) {
            if ((err as { response?: { status?: number } }).response?.status !== 404) {
                console.error('Failed to fetch active plan', err);
            }
        }

        if (!sessionId) {
            history.push('/assessment/context');
            setIsPlanActionLoading(false);
            return;
        }

        try {
            const createdPlan = await assessmentApi.createPlan({ run_id: sessionId });
            setActivePlanId(createdPlan.plan_id);
            history.push(`/plan/${createdPlan.plan_id}`);
        } catch (err) {
            console.error('Failed to create plan', err);
        } finally {
            setIsPlanActionLoading(false);
        }
    };

    const handleDashboardAction = async (cta?: DashboardCTA): Promise<void> => {
        if (!cta) return;

        if (cta.action === 'start_assessment') {
            history.push('/assessment/context');
            return;
        }

        if (cta.action === 'open_plan' || cta.action === 'add_to_plan' || cta.action === 'open_skill_plan') {
            await openOrCreatePlan();
            return;
        }

        if (sessionId) {
            history.push(`/results?session=${sessionId}`);
            return;
        }

        history.push('/assessment/context');
    };

    const verdictContent = getSummaryContent(verdictBlock);
    const analysisContent = getAnalysisContent(analysisBlock);
    const radarContent = getRadarContent(radarBlock);
    const skillsContent = getSkillsContent(skillsBlock);
    const metricsContent = getMetricsContent(metricsBlock);
    const insightsContent = getInsightsContent(insightsBlock);
    const recommendationsContent = getRecommendationsContent(recommendationsBlock);
    const progressContent = getProgressContent(progressBlock);
    const actionContent = getActionContent(actionBlock);

    const radarData: RadarPoint[] = (radarContent?.axes || []).map((axis) => ({
        id: String(axis.id),
        subject: axis.label,
        A: toPercentNumber(axis.value),
        fullMark: 100,
    }))
        .filter((axis) => axis.subject && Number.isFinite(axis.A));

    const radarBenchmarkValues = Object.fromEntries(
        Object.entries(radarContent?.benchmark?.values || {}).map(([key, value]) => [
            key,
            toPercentNumber(Number(value)),
        ]),
    );
    const hasRadarChartData = radarData.length >= 3 && radarData.some((item) => item.A > 0);
    const topRadarAxes = [...radarData]
        .sort((left, right) => right.A - left.A)
        .slice(0, 3);

    const readinessRaw =
        dashboard?.overall.readiness ??
        dashboard?.overall.readiness_score ??
        0;
    const readinessValue = toPercentNumber(readinessRaw);
    const confidenceValue = toPercentNumber(dashboard?.overall.confidence ?? 0);
    const roleLabel = dashboard?.overall.target_role || 'Backend Engineer';

    const toggleInsightWhy = async (insightKey: string, evidenceRefs: string[]): Promise<void> => {
        const isOpen = !!expandedInsightIds[insightKey];
        setExpandedInsightIds((prev) => ({ ...prev, [insightKey]: !isOpen }));

        if (isOpen || evidenceRefs.length === 0 || insightEvidence[insightKey]) {
            return;
        }

        setInsightEvidenceLoading((prev) => ({ ...prev, [insightKey]: true }));
        try {
            const evidence = await assessmentApi.getEvidenceByIds(evidenceRefs);
            setInsightEvidence((prev) => ({ ...prev, [insightKey]: evidence || [] }));
        } catch (err) {
            console.error('Failed to load evidence refs', err);
            setInsightEvidence((prev) => ({ ...prev, [insightKey]: [] }));
        } finally {
            setInsightEvidenceLoading((prev) => ({ ...prev, [insightKey]: false }));
        }
    };

    return (
        <IonPage className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors animate-fade-in">
            <AILoadingOverlay
                isOpen={(analysisRequested && loading) || isPlanActionLoading}
                title={isPlanActionLoading ? 'AI is generating your weekly plan' : 'AI is generating your dashboard'}
                message={
                    isPlanActionLoading
                        ? 'Building a 7-day roadmap from your latest assessment...'
                        : 'Analyzing signals and assembling profile insights...'
                }
            />
            <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center mt-6 mb-2">
                        <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 font-bold text-2xl mb-4 shadow-md border-4 border-white dark:border-gray-800">
                            {initials}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {user?.email.split('@')[0]}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user?.email}</p>
                    </div>

                    {!analysisRequested && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{uiCopy.profileAnalysisTitle}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {uiCopy.profileAnalysisHint}
                            </p>
                            <IonButton
                                expand="block"
                                onClick={() => setAnalysisRequested(true)}
                            >
                                {uiCopy.runAnalysis}
                            </IonButton>
                        </div>
                    )}

                    {analysisRequested && dashboard && (
                        <div className="grid grid-cols-3 gap-3 mb-2">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                                <div className="text-xs text-gray-400 uppercase tracking-wide">{uiCopy.readiness}</div>
                                <div className="text-lg font-bold text-indigo-600 mt-1">{formatPercent(readinessValue)}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{uiCopy.role}</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 truncate">{roleLabel}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{uiCopy.tests}</div>
                                <div className="text-lg font-bold text-emerald-600 mt-1">
                                    {dashboard?.overall.tests_count ?? dashboard?.aggregate?.tests_count ?? 0}
                                </div>
                            </div>
                        </div>
                    )}

                    {analysisRequested && loading && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-300">{uiCopy.loadingProfile}</span>
                        </div>
                    )}

                    {analysisRequested && error && !loading && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {analysisRequested && !loading && !dashboard && !error && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{uiCopy.emptyTitle}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {uiCopy.emptyDescription}
                            </p>
                            <IonButton expand="block" onClick={() => history.push('/assessment/context')}>
                                {uiCopy.startAssessment}
                            </IonButton>
                        </div>
                    )}

                    {analysisRequested && !loading && dashboard && (
                        <div className="space-y-5">
                            {verdictContent && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="text-xs uppercase tracking-widest text-indigo-500 font-semibold mb-2">
                                        {verdictBlock?.title || 'AI Verdict'}
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                                        {verdictContent.headline}
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        {verdictContent.bullets.map((bullet, idx) => (
                                            <div key={`verdict-bullet-${idx}`} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <span>{bullet}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <IonButton
                                        expand="block"
                                        className="mt-4"
                                        onClick={() => void handleDashboardAction(verdictContent.cta)}
                                    >
                                        {activePlanId ? uiCopy.continuePlan : verdictContent.cta.text}
                                    </IonButton>
                                </div>
                            )}

                            {analysisContent && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                                        {analysisBlock?.title || 'AI Analysis'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs uppercase tracking-widest font-semibold text-emerald-600 mb-2">
                                                {uiCopy.strengths}
                                            </div>
                                            <div className="space-y-2">
                                                {analysisContent.strengths.map((item, idx) => (
                                                    <div key={`strength-${idx}`} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                                                        <span className="text-emerald-600">+</span>
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-widest font-semibold text-amber-600 mb-2">
                                                {uiCopy.weaknesses}
                                            </div>
                                            <div className="space-y-2">
                                                {analysisContent.weaknesses.map((item, idx) => (
                                                    <div key={`weak-${idx}`} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                                                        <span className="text-amber-600">!</span>
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-widest font-semibold text-indigo-600 mb-2">
                                                {uiCopy.recommendations}
                                            </div>
                                            <div className="space-y-2">
                                                {analysisContent.recommendations.map((item, idx) => (
                                                    <div key={`analysis-rec-${idx}`} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                                                        <span className="text-indigo-600">&gt;</span>
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {insightsContent && insightsContent.items.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {insightsBlock?.title || 'Key Insights'}
                                    </h3>
                                    {insightsContent.items.map((insight, idx) => {
                                        const insightKey = `${idx}-${insight.text_short}`;
                                        const expanded = !!expandedInsightIds[insightKey];
                                        const evidence = insightEvidence[insightKey] || [];
                                        const loadingEvidence = !!insightEvidenceLoading[insightKey];
                                        const severityClass =
                                            insight.severity === 'critical'
                                                ? 'text-rose-700 bg-rose-50 border-rose-200'
                                                : insight.severity === 'warn'
                                                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                    : 'text-indigo-700 bg-indigo-50 border-indigo-200';

                                        return (
                                            <div key={insightKey} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className={`text-[10px] px-2 py-1 rounded-full border uppercase tracking-wider font-semibold ${severityClass}`}>
                                                        {insight.severity}
                                                    </div>
                                                    <button
                                                        className="text-xs text-indigo-600 font-semibold"
                                                        onClick={() => toggleInsightWhy(insightKey, insight.evidence_refs || [])}
                                                    >
                                                        {expanded ? uiCopy.hideWhy : uiCopy.why}
                                                    </button>
                                                </div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2">
                                                    {insight.text_short}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                    {insight.why}
                                                </div>
                                                {expanded && (
                                                    <div className="mt-3 space-y-2">
                                                        {loadingEvidence && (
                                                            <div className="text-xs text-gray-500">{uiCopy.loadingEvidence}</div>
                                                        )}
                                                        {!loadingEvidence && evidence.length === 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                {uiCopy.noEvidence}
                                                            </div>
                                                        )}
                                                        {!loadingEvidence && evidence.map((item) => (
                                                            <div key={item.evidence_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                                                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                                                    {item.source_type} | confidence {formatPercent(item.confidence)}
                                                                </div>
                                                                <div className="text-xs text-gray-700 dark:text-gray-200 mt-1">
                                                                    {item.snippet}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {radarContent && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                    {hasRadarChartData ? (
                                        <div className="min-h-[260px] h-[260px]">
                                            <PsychometricRadar
                                                data={radarData}
                                                benchmarkValues={radarBenchmarkValues}
                                                title={radarBlock?.title || 'Capability Map'}
                                                color="#0F766E"
                                                height={260}
                                            />
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                                            <div className="text-sm text-gray-600">
                                                {uiLang === 'ru'
                                                    ? 'Недостаточно данных для паутины'
                                                    : uiLang === 'kz'
                                                        ? 'Өрмек графигіне дерек жеткіліксіз'
                                                        : 'Not enough data for radar'}
                                            </div>
                                            {topRadarAxes.length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    {topRadarAxes.map((axis) => (
                                                        <div key={`radar-fallback-${axis.id}`} className="text-xs text-gray-700">
                                                            {axis.subject}: {formatPercent(axis.A)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{radarContent.ai_note}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {radarContent.axes.map((axis) => {
                                            const score = toPercentNumber(axis.value);
                                            const target = toPercentNumber(radarContent.benchmark.values[axis.id] ?? 0);
                                            return (
                                                <div key={axis.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-xs">
                                                    <div className="font-semibold text-gray-700 dark:text-gray-200">{axis.label}</div>
                                                    <div className="text-gray-500 dark:text-gray-300">
                                                        {formatPercent(score)} / {uiCopy.target} {formatPercent(target)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {skillsContent && skillsContent.items.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{skillsBlock?.title || 'Skills'}</h3>
                                    {skillsContent.items.map((skill) => (
                                        <div key={skill.skill_id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{skill.label}</div>
                                                <div className={`text-sm font-bold ${statusTextClass(skill.status)}`}>{formatPercent(skill.score)}</div>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className={`h-full rounded-full ${skill.status === 'good' ? 'bg-emerald-500' : skill.status === 'medium' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${toPercentNumber(skill.score)}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-300">{skill.level} | {skill.target_hint}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-200 mt-1">{skill.ai_note}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {metricsContent && metricsContent.items.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{metricsBlock?.title || 'Key Metrics'}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {metricsContent.items.map((metric) => (
                                            <div key={metric.metric_id} className={`rounded-xl border p-3 ${statusBgClass(metric.status)}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${metricStatusDotClass(metric.status)}`} />
                                                    <span className="text-xs uppercase tracking-wider text-gray-500">{metric.label}</span>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900 mt-1">{formatPercent(metric.value)}</div>
                                                <div className="text-[11px] text-gray-600 mt-1">{metric.hint}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {recommendationsContent && recommendationsContent.buckets.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{recommendationsBlock?.title || 'Recommendations'}</h3>
                                    {recommendationsContent.buckets.map((bucket) => (
                                        <div key={bucket.bucket_id}>
                                            <div className="text-xs uppercase tracking-widest text-indigo-500 font-semibold mb-2">{bucket.title}</div>
                                            <div className="space-y-2">
                                                {bucket.items.map((item) => (
                                                    <div key={item.rec_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.title}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                            {uiCopy.impactEffort}: {item.impact} | {uiCopy.effort}: {item.effort}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.estimated_impact}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {progressContent && progressContent.items.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{progressBlock?.title || 'Progress'}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{progressContent.ai_note}</p>
                                    <div className="space-y-2">
                                        {progressContent.items.map((item) => (
                                            <div key={`${item.date}-${item.label}`} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</div>
                                                    <div className="text-xs text-gray-500">{item.date}</div>
                                                </div>
                                                <div className={`text-sm font-bold ${item.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {item.delta >= 0 ? `+${item.delta}` : item.delta}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {actionContent && (
                                <div className="bg-gradient-to-br from-indigo-50 to-sky-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
                                    <h3 className="text-lg font-bold text-indigo-900">{actionBlock?.title || 'Next Best Action'}</h3>
                                    <p className="text-sm text-indigo-800 mt-2">{actionContent.description}</p>
                                    <IonButton
                                        expand="block"
                                        className="mt-4"
                                        onClick={() => void handleDashboardAction(actionContent.cta)}
                                    >
                                        {activePlanId ? uiCopy.continuePlan : actionContent.cta.text}
                                    </IonButton>
                                    <div className="text-xs text-indigo-700 mt-2">
                                        {uiCopy.confidence}: {formatPercent(confidenceValue)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-6">
                        <ProfileSettings
                            language={i18n.language}
                            onLanguageChange={handleLanguageChange}
                            showAdmin={!!(user?.is_superuser || user?.email === 'admin@example.com')}
                            onAdminClick={() => history.push('/admin-panel')}
                        />

                        <button
                            onClick={handleLogout}
                            className="w-full text-gray-400 text-sm font-medium py-4 hover:text-red-500 transition-colors"
                        >
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ProfilePage;
