import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonSelect,
    IonSelectOption
} from '@ionic/react';
import { globeOutline } from 'ionicons/icons';
import { AVAILABLE_LANGUAGES } from '@/utils/langUtils';

interface Props {
    language: string;
    onLanguageChange: (langCode: string) => void;
}

const ProfileSettings: React.FC<Props> = ({ language, onLanguageChange }) => {
    const { t } = useTranslation();

    return (
        <IonCard className="shadow-sm">
            <IonCardHeader>
                <IonCardTitle>{t('profile.settings')}</IonCardTitle>
            </IonCardHeader>
            <IonList>
                <IonItem>
                    <IonIcon icon={globeOutline} slot="start" color="primary" />
                    <IonLabel>{t('profile.language')}</IonLabel>
                    <IonSelect
                        value={language}
                        interface="action-sheet"
                        onIonChange={(e) => onLanguageChange(e.detail.value)}
                        placeholder={t('profile.select_language')}
                    >
                        {AVAILABLE_LANGUAGES.map((lang) => (
                            <IonSelectOption key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                            </IonSelectOption>
                        ))}
                    </IonSelect>
                </IonItem>
                <IonItem button detail>
                    <IonLabel>{t('profile.notifications')}</IonLabel>
                </IonItem>
                <IonItem button detail>
                    <IonLabel>{t('profile.privacy')}</IonLabel>
                </IonItem>
                <IonItem button detail>
                    <IonLabel>{t('profile.about')}</IonLabel>
                </IonItem>
            </IonList>
        </IonCard>
    );
};

export default ProfileSettings;
