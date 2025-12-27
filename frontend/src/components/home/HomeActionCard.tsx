import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonCard,
    IonCardContent,
    IonButton,
    IonSpinner
} from '@ionic/react';

interface Props {
    starting: boolean;
    onStart: () => void;
}

const HomeActionCard: React.FC<Props> = ({ starting, onStart }) => {
    const { t } = useTranslation();

    return (
        <IonCard className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-indigo-600">
            <IonCardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {t('home.start_assessment')}
                </h2>
                <p className="text-blue-100 mb-4">
                    {t('home.start_description')}
                </p>
                <IonButton
                    expand="block"
                    color="light"
                    onClick={onStart}
                    disabled={starting}
                    className="font-semibold"
                >
                    {starting ? (
                        <>
                            <IonSpinner name="crescent" className="mr-2" />
                            {t('common.loading')}
                        </>
                    ) : (
                        t('home.begin_now')
                    )}
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default HomeActionCard;
