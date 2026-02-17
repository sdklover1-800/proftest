import React, { useState } from 'react';
import {
    IonPage,
    IonContent,
    IonButton,
    IonSpinner,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useProfile } from '../model/useProfile';
import { useProfileDashboard } from '../model/useProfileDashboard';
import ProfileSettings from './ProfileSettings';
import PsychometricRadar from '@/shared/ui/PsychometricRadar';
import type { DashboardCTA, DashboardMetricItem } from '@/types/assessment';
import { assessmentApi } from '@/api/assessmentApi';

interface EvidenceItem {
    evidence_id: string;
    source_type: string;
    snippet: string;
    confidence: number;
    tags: string[];
}

interface RadarPoint {
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
    } = useProfileDashboard();

    const history = useHistory();

    const initials = user?.email
        ? user.email.substring(0, 2).toUpperCase()
        : '??';
    const [expandedInsightIds, setExpandedInsightIds] = useState<Record<string, boolean>>({});
    const [insightEvidence, setInsightEvidence] = useState<Record<string, EvidenceItem[]>>({});
    const [insightEvidenceLoading, setInsightEvidenceLoading] = useState<Record<string, boolean>>({});

    const handleDashboardAction = (cta?: DashboardCTA): void => {
        if (!cta) return;

        if (cta.action === 'start_assessment') {
            history.push('/assessment/context');
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
        subject: axis.label,
        A: axis.value,
        fullMark: 100,
    }));

    const readinessValue = dashboard?.overall.readiness_score ?? 0;
    const confidenceValue = dashboard?.overall.confidence
        ? Math.round(dashboard.overall.confidence * 100)
        : 0;
    const roleLabel = dashboard?.overall.target_role || 'Backend Engineer';
    const levelLabel = dashboard?.overall.target_level || 'Middle';

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

                    <div className="grid grid-cols-3 gap-3 mb-2">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Readiness</div>
                            <div className="text-lg font-bold text-indigo-600 mt-1">{readinessValue}%</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Role</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 truncate">{roleLabel}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Level</div>
                            <div className="text-lg font-bold text-emerald-600 mt-1">{levelLabel}</div>
                        </div>
                    </div>

                    {loading && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <IonSpinner name="crescent" />
                            <span className="text-sm text-gray-500 dark:text-gray-300">Loading AI profile...</span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {!loading && !dashboard && !error && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Career Copilot</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Complete one assessment to unlock profile verdict, diagnostics, and a 7-day growth plan.
                            </p>
                            <IonButton expand="block" onClick={() => history.push('/assessment/context')}>
                                Start assessment
                            </IonButton>
                        </div>
                    )}

                    {!loading && dashboard && (
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
                                        onClick={() => handleDashboardAction(verdictContent.cta)}
                                    >
                                        {verdictContent.cta.text}
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
                                                Strengths
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
                                                Weaknesses
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
                                                Recommendations
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
                                                        {expanded ? 'Hide why' : 'Why?'}
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
                                                            <div className="text-xs text-gray-500">Loading evidence...</div>
                                                        )}
                                                        {!loadingEvidence && evidence.length === 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                No evidence snippets available.
                                                            </div>
                                                        )}
                                                        {!loadingEvidence && evidence.map((item) => (
                                                            <div key={item.evidence_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                                                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                                                    {item.source_type} | confidence {Math.round((item.confidence || 0) * 100)}%
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

                            {radarContent && radarData.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                    <PsychometricRadar
                                        data={radarData}
                                        title={radarBlock?.title || 'Capability Map'}
                                        color="#0F766E"
                                    />
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{radarContent.ai_note}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {radarContent.axes.map((axis) => {
                                            const target = radarContent.benchmark.values[axis.id] ?? 0;
                                            return (
                                                <div key={axis.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-xs">
                                                    <div className="font-semibold text-gray-700 dark:text-gray-200">{axis.label}</div>
                                                    <div className="text-gray-500 dark:text-gray-300">
                                                        {axis.value}% / target {target}%
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
                                                <div className={`text-sm font-bold ${statusTextClass(skill.status)}`}>{skill.score}%</div>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className={`h-full rounded-full ${skill.status === 'good' ? 'bg-emerald-500' : skill.status === 'medium' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${skill.score}%` }}
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
                                                <div className="text-lg font-bold text-gray-900 mt-1">{metric.value}%</div>
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
                                                            Impact: {item.impact} | Effort: {item.effort}
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
                                        onClick={() => handleDashboardAction(actionContent.cta)}
                                    >
                                        {actionContent.cta.text}
                                    </IonButton>
                                    <div className="text-xs text-indigo-700 mt-2">
                                        Confidence: {confidenceValue}%
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
