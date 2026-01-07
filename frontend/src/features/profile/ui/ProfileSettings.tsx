import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSelect,
    IonSelectOption
} from '@ionic/react';
import {
    globeOutline,
    notificationsOutline,
    shieldCheckmarkOutline,
    informationCircleOutline
} from 'ionicons/icons';
import { AVAILABLE_LANGUAGES } from '@/utils/langUtils';

interface Props {
    language: string;
    onLanguageChange: (langCode: string) => void;
}

const ProfileSettings: React.FC<Props> = ({ language, onLanguageChange }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <IonList inset={false} lines="full" className="m-0 p-0">
                <IonItem className="--padding-start-0">
                    <IonIcon icon={globeOutline} slot="start" className="text-blue-500 ml-4" />
                    <IonLabel className="font-medium text-gray-700">{t('profile.language')}</IonLabel>
                    <IonSelect
                        value={language}
                        interface="action-sheet"
                        onIonChange={(e) => onLanguageChange(e.detail.value)}
                        placeholder={t('profile.select_language')}
                        className="max-w-[fit-content]"
                    >
                        {AVAILABLE_LANGUAGES.map((lang) => (
                            <IonSelectOption key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                            </IonSelectOption>
                        ))}
                    </IonSelect>
                </IonItem>

                {['notifications', 'privacy', 'about'].map((item) => (
                    <IonItem key={item} button detail className="--padding-start-0">
                        <IonIcon
                            icon={
                                item === 'notifications' ? notificationsOutline :
                                    item === 'privacy' ? shieldCheckmarkOutline :
                                        informationCircleOutline
                            }
                            slot="start"
                            className={`ml-4 ${item === 'notifications' ? 'text-yellow-500' :
                                item === 'privacy' ? 'text-green-500' :
                                    'text-gray-500'
                                }`}
                        />
                        <IonLabel className="font-medium text-gray-700">{t(`profile.${item}`)}</IonLabel>
                    </IonItem>
                ))}
            </IonList>
        </div>
    );
};

export default ProfileSettings;
