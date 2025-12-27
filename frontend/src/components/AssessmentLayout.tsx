import React, { type ReactNode } from 'react';
import { IonPage, IonHeader, IonContent, IonProgressBar, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/react';

interface Props {
    children: ReactNode;
    title?: string;
    progress?: number; // 0 to 1
}

const AssessmentLayout: React.FC<Props> = ({ children, title, progress }) => {
    return (
        <IonPage>
            <IonHeader className="ion-no-border shadow-none">
                <IonToolbar color="light">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/" />
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
