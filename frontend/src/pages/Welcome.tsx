import React from 'react';
import { IonContent, IonButton, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AssessmentLayout from '../components/AssessmentLayout';

const Welcome: React.FC = () => {
    const history = useHistory();

    return (
        <AssessmentLayout>
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Youth Assessment
                    </h1>
                    <p className="text-lg text-gray-600 max-w-sm">
                        Discover your potential through our comprehensive analysis.
                    </p>
                </div>

                <IonButton
                    shape="round"
                    size="large"
                    className="w-full max-w-xs font-bold"
                    onClick={() => history.push('/assessment')}
                >
                    Start Assessment
                </IonButton>

                <div className="absolute bottom-6 text-xs text-gray-400">
                    v1.0.0
                </div>
            </div>
        </AssessmentLayout>
    );
};

export default Welcome;
