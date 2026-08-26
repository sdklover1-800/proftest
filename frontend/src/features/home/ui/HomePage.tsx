import React from 'react';
import {
    IonPage,
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

    // Generate initials for avatar
    const initials = userName
        ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';

    return (
        <IonPage className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors animate-fade-in">
            <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900 transition-colors">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh} className="z-50">
                    <IonRefresherContent />
                </IonRefresher>

                <div className="p-6 pb-24">
                    {/* Custom Mobile Header */}
                    <div className="flex justify-between items-center mb-8 pt-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {t('home.welcome_back', { name: userName ? userName.split(' ')[0] : t('common.user', 'User') })} 👋
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">{t('home.ready_message')}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-100 font-bold border-2 border-white dark:border-gray-800 shadow-sm">
                            {initials}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <HomeActionCard
                            starting={starting}
                            onStart={handleStartAssessment}
                        />

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 px-1">
                                <IonIcon icon={calendarOutline} aria-hidden="true" className="text-indigo-600" />
                                {t('home.history_title')}
                            </h3>

                            <HomeHistoryList
                                loading={loading}
                                sessions={sessions}
                                onViewResults={viewSessionResults}
                            />
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default HomePage;
