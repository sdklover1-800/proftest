import React, { type ReactNode } from 'react';
import { IonPage, IonHeader, IonContent, IonProgressBar, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
    children: ReactNode;
    title?: string;
    progress?: number; // 0 to 1
}

/**
 * Layout wrapper for the assessment flow.
 * Provides header with progress bar and close button.
 */
const AssessmentLayout: React.FC<Props> = ({ children, title, progress }) => {
    const history = useHistory();
    const { t } = useTranslation();

    const handleClose = () => {
        if (window.confirm(t('assessment.exit_confirm'))) {
            history.push('/home');
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border shadow-none">
                <IonToolbar color="light">
                    <IonButtons slot="end">
                        <IonButton onClick={handleClose}>
                            <IonIcon icon={close} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="text-sm font-semibold text-gray-800">{title}</IonTitle>
                </IonToolbar>
                {progress !== undefined && (
                    <IonProgressBar value={progress} color="primary" className="h-1" />
                )}
            </IonHeader>
            <IonContent className="bg-gray-50">
                <div className="flex flex-col h-full max-w-md mx-auto bg-white min-h-screen">
                    {children}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AssessmentLayout;
