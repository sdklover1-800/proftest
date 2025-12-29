import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { usePdfExport } from '../model/usePdfExport';
import ResultCharts from './ResultCharts';
import RecommendationList from './RecommendationList';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';

/**
 * Results page - ultra-thin wrapper.
 * All logic is in useResultsPage hook, this only renders.
 */
const ResultsPage: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const reset = useAssessmentStore((state) => state.reset);

    const contentRef = useRef<HTMLDivElement>(null);
    const { isPdfGenerating, downloadPDF } = usePdfExport(contentRef as React.RefObject<HTMLDivElement>);
    const { results, recommendations, loading, error, activeTab, setActiveTab } = useResultsPage();

    const handleHome = (): void => {
        reset();
        history.push('/home');
    };

    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding flex items-center justify-center h-full">
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <IonSpinner name="crescent" />
                        <p className="text-gray-500">{t('results.calculating')}</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (error || !results) {
        return (
            <IonPage>
                <IonContent className="ion-padding">
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
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={handleHome}><IonIcon icon={homeOutline} /></IonButton>
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

            <IonContent className="ion-padding bg-gray-50">
                <div ref={contentRef} className="max-w-md mx-auto space-y-6 pb-24 bg-gray-50">

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

                    <ResultCharts activeTab={activeTab} results={results} />

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4">
                            <span>🚀</span> {t('results.development_plan')}
                        </h3>
                        <RecommendationList recommendations={recommendations} />
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
