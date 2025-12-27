import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonToast,
    IonSpinner,
} from '@ionic/react';
import { useAuthStore } from '../../store/authStore';

const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState<number | undefined>(undefined);
    const [showToast, setShowToast] = useState(false);

    const handleRegister = async () => {
        try {
            await register(email, password, age);
            history.push('/');
        } catch (err) {
            setShowToast(true);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>{t('auth.register')}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto mt-8 space-y-6">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.create_account')}</h1>
                        <p className="text-gray-500">{t('auth.register_subtitle')}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">{t('auth.email')}</IonLabel>
                            <IonInput
                                type="email"
                                value={email}
                                onIonChange={(e) => setEmail(e.detail.value!)}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">{t('auth.password')}</IonLabel>
                            <IonInput
                                type="password"
                                value={password}
                                onIonChange={(e) => setPassword(e.detail.value!)}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">{t('auth.age')} ({t('common.optional', 'Optional')})</IonLabel>
                            <IonInput
                                type="number"
                                value={age}
                                onIonChange={(e) => setAge(e.detail.value ? parseInt(e.detail.value) : undefined)}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonButton
                            expand="block"
                            onClick={handleRegister}
                            disabled={isLoading || !email || !password}
                            className="mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <IonSpinner name="crescent" className="mr-2" />
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('auth.register')
                            )}
                        </IonButton>

                        <div className="text-center mt-4">
                            <p className="text-gray-600 text-sm">
                                {t('auth.have_account')}{' '}
                                <button
                                    onClick={() => history.push('/login')}
                                    className="text-blue-600 font-medium hover:underline"
                                    disabled={isLoading}
                                >
                                    {t('auth.login_here')}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => {
                        setShowToast(false);
                        clearError();
                    }}
                    message={error || t('common.error')}
                    duration={3000}
                    color="danger"
                />
            </IonContent>
        </IonPage>
    );
};

export default RegisterPage;
