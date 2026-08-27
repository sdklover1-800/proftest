import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSpinner,
    IonButton,
    IonButtons,
    IonIcon,
    IonFab,
    IonFabButton,
} from '@ionic/react';
import { downloadOutline, homeOutline } from 'ionicons/icons';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultsPage } from '../model/useResultsPage';
import CareerMatchList from './CareerMatchList';
import ScoresAgainstNorm from './ScoresAgainstNorm';
import { usePdfExport } from '../model/usePdfExport';
import ResultCharts from './ResultCharts';
import DevelopmentPlan from './DevelopmentPlan';
import AILoadingOverlay from '@/shared/ui/AILoadingOverlay';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';

/**
 * Results page - ultra-thin wrapper.
 * All logic is in useResultsPage hook, this only renders.
 */
const ResultsPage: React.FC = () => {
    const { t } = useTranslation();
    const historyNav = useHistory();
    const reset = useAssessmentStore((state) => state.resetAssessment);

    const contentRef = useRef<HTMLDivElement>(null);
    const { isPdfGenerating, downloadPDF } = usePdfExport(contentRef as React.RefObject<HTMLDivElement>);
    const {
        results, recommendations, aiInsights, loading, error, activeTab, setActiveTab,
        history, historyLoading, careers, norms,
    } = useResultsPage();

    const cognitiveScore = results?.COGNITIVE?.total_score ?? 0;
    const formatSkillLabel = (key: string): string =>
        key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    const sjtLabelMap: Record<string, string> = {
        teamwork: t('results.sjt_teamwork'),
        stress: t('results.sjt_stress'),
        initiative: t('results.sjt_initiative'),
        self_organization: t('results.sjt_self_organization'),
        learning_strategy: t('results.sjt_learning_strategy'),
    };
    const cognitiveLabelMap: Record<string, string> = {
        processing_speed: t('results.cognitive_processing_speed'),
        working_memory: t('results.cognitive_working_memory'),
        attention: t('results.cognitive_attention'),
        logic: t('results.cognitive_logic'),
        math: t('results.cognitive_math'),
    };

    // The API keys scales by their internal names; the report shows the words
    // the rest of the interface already uses.
    const scaleLabel = (module: string, scale: string): string => {
        const keys: Record<string, string> = {
            'RIASEC.Realistic': 'results.riasec_realistic',
            'RIASEC.Investigative': 'results.riasec_investigative',
            'RIASEC.Artistic': 'results.riasec_artistic',
            'RIASEC.Social': 'results.riasec_social',
            'RIASEC.Enterprising': 'results.riasec_enterprising',
            'RIASEC.Conventional': 'results.riasec_conventional',
            'BIG5.Openness': 'results.big5_openness',
            'BIG5.Conscientiousness': 'results.big5_conscientiousness',
            'BIG5.Extraversion': 'results.big5_extraversion',
            'BIG5.Agreeableness': 'results.big5_agreeableness',
            'BIG5.Neuroticism': 'results.big5_neuroticism',
            'COGNITIVE.processing_speed': 'results.cognitive_processing_speed',
            'COGNITIVE.working_memory': 'results.cognitive_working_memory',
            'COGNITIVE.attention': 'results.cognitive_attention',
            'COGNITIVE.logic': 'results.cognitive_logic',
            'COGNITIVE.total_score': 'results.cognitive_title',
            'SJT.teamwork': 'results.sjt_teamwork',
            'SJT.stress': 'results.sjt_stress',
            'SJT.initiative': 'results.sjt_initiative',
            'SJT.self_organization': 'results.sjt_self_organization',
            'SJT.self_org': 'results.sjt_self_organization',
            'SJT.learning': 'results.sjt_learning_strategy',
        };
        const key = keys[`${module}.${scale}`];
        return key ? t(key, scale) : scale;
    };

    const handleHome = (): void => {
        reset();
        historyNav.push('/home');
    };

    const formatDate = (dateString: string): string => {
        try {
            return format(new Date(dateString), 'd MMM, HH:mm', { locale: ru });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <IonPage className="bg-background text-foreground transition-colors animate-fade-in">
                <AILoadingOverlay
                    isOpen={loading}
                    title="AI is generating your results"
                    message="Scoring modules and preparing personalized recommendations..."
                />
                <IonContent className="ion-padding flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 transition-colors">
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <p className="text-gray-500">{t('results.calculating')}</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (error || !results) {
        return (
            <IonPage className="bg-background text-foreground transition-colors animate-fade-in">
                <IonContent className="bg-background transition-colors">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h2 className="text-xl font-bold text-red-500 mb-2">{t('common.error')}</h2>
                        <p className="text-gray-600 mb-6">{error || t('results.not_found')}</p>
                        <IonButton onClick={handleHome}>{t('results.back_home')}</IonButton>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage className="bg-background text-foreground transition-colors animate-fade-in">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={handleHome} aria-label={t('tabs.home')}><IonIcon icon={homeOutline} aria-hidden="true" /></IonButton>
                    </IonButtons>
                    <IonTitle>{t('results.your_result')}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => downloadPDF()} disabled={isPdfGenerating}>
                            <IonIcon icon={downloadOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <LoadingOverlay isOpen={isPdfGenerating} message={t('results.generating_pdf')} />

            <IonContent className="bg-background transition-colors">
                <div ref={contentRef} className="mx-auto w-full max-w-5xl space-y-7 px-5 pb-24 pt-4 transition-colors sm:px-8 lg:px-10 lg:pb-12">

                    <CareerMatchList careers={careers} />

                    <ScoresAgainstNorm norms={norms} labelFor={scaleLabel} />

                    {/* Tab Switcher */}
                    <div className="flex rounded-lg bg-gray-200 p-1">
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'RIASEC' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveTab('RIASEC')}
                        >
                            {t('results.interests')}
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'BIG5' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveTab('BIG5')}
                        >
                            {t('results.personality')}
                        </button>
                    </div>


                    {/* Context Warning */}
                    {results.contextData && (results.contextData.sleep < 6 || results.contextData.stress === 'high') && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="text-sm text-yellow-800 font-medium">
                                    {t('results.context_warning')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI Insights */}
                    {aiInsights && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800">{t('results.ai_title')}</h3>
                            {aiInsights.summary && (
                                <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.summary}</p>
                            )}
                            <div className="grid gap-4">
                                {(aiInsights.strengths || []).length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
                                            {t('results.ai_strengths')}
                                        </div>
                                        <div className="space-y-2">
                                            {(aiInsights.strengths || []).map((item, idx) => (
                                                <div key={`ai-strength-${idx}`} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(aiInsights.growth_areas || []).length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-2">
                                            {t('results.ai_growth')}
                                        </div>
                                        <div className="space-y-2">
                                            {(aiInsights.growth_areas || []).map((item, idx) => (
                                                <div key={`ai-growth-${idx}`} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(aiInsights.recommended_paths || []).length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-2">
                                            {t('results.ai_paths')}
                                        </div>
                                        <div className="space-y-2">
                                            {(aiInsights.recommended_paths || []).map((item, idx) => (
                                                <div key={`ai-path-${idx}`} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(aiInsights.next_steps || []).length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold text-purple-500 uppercase tracking-widest mb-2">
                                            {t('results.ai_next_steps')}
                                        </div>
                                        <div className="space-y-2">
                                            {(aiInsights.next_steps || []).map((item, idx) => (
                                                <div key={`ai-step-${idx}`} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* What Results Mean */}
                    {aiInsights?.module_explanations && Object.keys(aiInsights.module_explanations).length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800">{t('results.explanations_title')}</h3>
                            <div className="space-y-4">
                                {(['RIASEC', 'BIG5', 'COGNITIVE', 'SJT'] as const).map((moduleKey) => {
                                    const info = aiInsights.module_explanations?.[moduleKey];
                                    if (!info || (!info.meaning && !info.how_to_use)) {
                                        return null;
                                    }
                                    const moduleLabelMap: Record<string, string> = {
                                        RIASEC: t('assessment.module_names.riasec'),
                                        BIG5: t('assessment.module_names.big5'),
                                        COGNITIVE: t('assessment.module_names.cognitive'),
                                        SJT: t('assessment.module_names.sjt'),
                                    };
                                    return (
                                        <div key={`explain-${moduleKey}`} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="text-sm font-semibold text-gray-800 mb-2">
                                                {moduleLabelMap[moduleKey] || moduleKey}
                                            </div>
                                            {info.meaning && (
                                                <div className="text-sm text-gray-700 mb-2">
                                                    <span className="font-semibold text-gray-700">
                                                        {t('results.explanations_meaning')}:
                                                    </span>{' '}
                                                    {info.meaning}
                                                </div>
                                            )}
                                            {info.how_to_use && (
                                                <div className="text-sm text-gray-700">
                                                    <span className="font-semibold text-gray-700">
                                                        {t('results.explanations_how')}:
                                                    </span>{' '}
                                                    {info.how_to_use}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <ResultCharts activeTab={activeTab} results={results} />

                    {/* Cognitive Skills Section */}
                    {results.COGNITIVE && typeof results.COGNITIVE.total_score === 'number' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('results.cognitive_title')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-gray-700">{t('results.logic_label')}</span>
                                        <span className="font-bold text-indigo-600 text-lg">{cognitiveScore}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                            style={{ width: `${cognitiveScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cognitive Sub-Blocks */}
                    {results.COGNITIVE?.details && Object.keys(results.COGNITIVE.details).length > 0 && (
                        <div className="space-y-4">
                            {Object.entries(results.COGNITIVE.details).map(([key, value]) => (
                                <div key={key} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-gray-700">
                                            {cognitiveLabelMap[key] || formatSkillLabel(key)}
                                        </span>
                                        <span className="font-bold text-indigo-600">{value}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Soft Skills (SJT) Section */}
                    {results.SJT && Object.keys(results.SJT).length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('results.soft_skills_title')}</h3>
                            <div className="space-y-4">
                                {Object.entries(results.SJT).map(([subject, value]) => (
                                    <div key={subject}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 capitalize">
                                                {sjtLabelMap[subject] || formatSkillLabel(subject)}
                                            </span>
                                            <span className="font-bold text-indigo-600">{value}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('results.history_title')}</h3>
                        {historyLoading ? (
                            <p className="text-sm text-gray-500">{t('common.loading')}</p>
                        ) : history.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('results.history_empty')}</p>
                        ) : (
                            <div className="space-y-3">
                                {history.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                                        <div>
                                            <div className="font-semibold text-gray-700">
                                                {item.top_result || t('home.test_number', { id: item.id })}
                                            </div>
                                            <div className="text-xs text-gray-400">{formatDate(item.date)}</div>
                                        </div>
                                        <div className="text-xs font-semibold text-indigo-500">
                                            {item.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4">
                            <span>🚀</span> {t('results.development_plan')}
                        </h3>
                        <DevelopmentPlan recommendations={recommendations} aiInsights={aiInsights} />
                    </div>

                    <div className="pt-4">
                        <IonButton expand="block" shape="round" onClick={handleHome} className="h-12 font-medium">
                            {t('results.back_home')}
                        </IonButton>
                    </div>
                </div>

                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => downloadPDF()} disabled={isPdfGenerating}>
                        {isPdfGenerating ? <IonSpinner name="crescent" /> : <IonIcon icon={downloadOutline} />}
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage >
    );
};

export default ResultsPage;
