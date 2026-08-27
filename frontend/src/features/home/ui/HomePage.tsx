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
        <IonPage className="bg-background text-foreground transition-colors animate-fade-in">
            <IonContent className="bg-background transition-colors">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh} className="z-50">
                    <IonRefresherContent />
                </IonRefresher>

                <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-2 sm:px-8 lg:px-10 lg:pb-12 lg:pt-8">
                    {/* Custom Mobile Header */}
                    <div className="mb-8 flex items-center justify-between gap-4 pt-4">
                        <div>
                            <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-3xl">
                                {t('home.welcome_back', { name: userName ? userName.split(' ')[0] : t('common.user', 'User') })}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">{t('home.ready_message')}</p>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                            {initials}
                        </div>
                    </div>

                    <div className="space-y-9">
                        <HomeActionCard
                            starting={starting}
                            onStart={handleStartAssessment}
                        />

                        <div>
                            <h3 className="mb-4 flex items-center gap-2 px-1 text-base font-semibold text-foreground">
                                <IonIcon icon={calendarOutline} aria-hidden="true" className="text-primary" />
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
