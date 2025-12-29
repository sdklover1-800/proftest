import React from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
} from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useHome } from '../model/useHome';
import HomeActionCard from './HomeActionCard';
import HomeHistoryList from './HomeHistoryList';

/**
 * Home page - ultra-thin wrapper.
 * All logic is in useHome hook.
 */
const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const {
        userName,
        sessions,
        loading,
        starting,
        handleRefresh,
        handleStartAssessment,
        viewSessionResults
    } = useHome();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>proftest</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent />
                </IonRefresher>

                <div className="max-w-2xl mx-auto space-y-6 pb-10">
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold text-gray-800">
                            {t('home.welcome_back', { name: userName })} 👋
                        </h1>
                        <p className="text-gray-500 mt-1">{t('home.ready_message')}</p>
                    </div>

                    <HomeActionCard
                        starting={starting}
                        onStart={handleStartAssessment}
                    />

                    <div className="mt-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <IonIcon icon={calendarOutline} className="text-indigo-600" />
                            {t('home.history_title')}
                        </h3>

                        <HomeHistoryList
                            sessions={sessions}
                            loading={loading}
                            onViewResults={viewSessionResults}
                        />
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default HomePage;
