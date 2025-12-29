import React from 'react';
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
    IonSpinner,
} from '@ionic/react';
import { useRegister } from '../model/useRegister';
import ErrorToast from '@/shared/ui/ErrorToast';

/**
 * Register page - thin wrapper.
 */
const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        email,
        setEmail,
        password,
        setPassword,
        age,
        setAge,
        isLoading,
        error,
        handleRegister,
        goToLogin,
        clearError
    } = useRegister();

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
                            <IonLabel position="floating">{t('auth.age')} ({t('common.optional')})</IonLabel>
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
                                    onClick={goToLogin}
                                    className="text-blue-600 font-medium hover:underline"
                                    disabled={isLoading}
                                >
                                    {t('auth.login_here')}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <ErrorToast
                    message={error}
                    onDismiss={clearError}
                />
            </IonContent>
        </IonPage>
    );
};

export default RegisterPage;
