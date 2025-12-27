import React from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
} from '@ionic/react';
import { useProfile } from '../hooks/useProfile';
import ProfileUserInfo from '../components/profile/ProfileUserInfo';
import ProfileSettings from '../components/profile/ProfileSettings';

const ProfilePage: React.FC = () => {
    const { user, t, i18n, handleLogout, handleLanguageChange } = useProfile();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>{t('tabs.profile')}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto space-y-6 mt-6">
                    <ProfileUserInfo user={user} />

                    <ProfileSettings
                        language={i18n.language}
                        onLanguageChange={handleLanguageChange}
                    />

                    <IonButton
                        expand="block"
                        color="danger"
                        onClick={handleLogout}
                        className="mt-6"
                    >
                        {t('auth.logout')}
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ProfilePage;
